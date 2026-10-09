import os
from datetime import datetime
from rest_framework import generics, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.conf import settings
from django.http import FileResponse, Http404
from .models import Order, OrderItem
from .serializers import (
    OrderCreateSerializer, OrderSerializer,
    OrderListSerializer
)
from customers.models import Customer
from utils.invoice import generate_invoice_pdf
from utils.email_utils import send_order_emails


def _generate_order_number():
    today = datetime.now().strftime('%Y%m%d')
    count = Order.objects.filter(order_number__startswith=f'ORD-{today}').count()
    return f"ORD-{today}-{str(count + 1).zfill(4)}"


def _generate_invoice_number():
    today = datetime.now().strftime('%Y%m%d')
    count = Order.objects.filter(invoice_number__startswith=f'INV-{today}').count()
    return f"INV-{today}-{str(count + 1).zfill(4)}"


class CreateOrderView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = OrderCreateSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        data = serializer.validated_data

        # Create or get customer (match by mobile)
        customer, _ = Customer.objects.get_or_create(
            mobile=data['mobile'],
            defaults={
                'name': data['name'],
                'email': data.get('email', ''),
                'address': data['address'],
                'city': data['city'],
                'state': data['state'],
                'pincode': data['pincode'],
            }
        )
        # Update customer info
        customer.name = data['name']
        customer.email = data.get('email', customer.email)
        customer.address = data['address']
        customer.city = data['city']
        customer.state = data['state']
        customer.pincode = data['pincode']
        customer.save()

        # Calculate totals on backend
        items_data = data['items']
        subtotal = 0
        total_discount = 0
        order_items_to_create = []

        for item_data in items_data:
            product = item_data['product']
            qty = item_data['quantity']
            unit_price = float(product.price)
            disc_price = float(product.discount_price) if product.discount_price else None

            effective_price = disc_price if disc_price else unit_price
            item_subtotal = effective_price * qty
            item_discount = (unit_price - effective_price) * qty if disc_price else 0

            subtotal += item_subtotal
            total_discount += item_discount

            thumbnail_url = ''
            if product.thumbnail:
                thumbnail_url = f"/media/{product.thumbnail.name}"

            order_items_to_create.append({
                'product': product,
                'size': item_data['size'],
                'color': item_data['color'],
                'quantity': qty,
                'price': unit_price,
                'discount_price': disc_price,
                'subtotal': item_subtotal,
                'product_name_snapshot': product.name,
                'product_thumbnail_snapshot': thumbnail_url,
            })

        total = subtotal  # no extra charges for now

        order_number = _generate_order_number()
        invoice_number = _generate_invoice_number()

        order = Order.objects.create(
            order_number=order_number,
            invoice_number=invoice_number,
            customer=customer,
            subtotal=round(subtotal + total_discount, 2),
            discount=round(total_discount, 2),
            total=round(total, 2),
            order_note=data.get('order_note', ''),
        )

        for oi in order_items_to_create:
            OrderItem.objects.create(order=order, **oi)

        # Generate invoice PDF
        try:
            invoice_rel_path = generate_invoice_pdf(order)
            order.invoice_path = invoice_rel_path
            order.save(update_fields=['invoice_path'])
        except Exception as e:
            print(f"[Invoice] PDF generation failed: {e}")

        # Send emails (non-blocking failure)
        try:
            send_order_emails(order)
        except Exception as e:
            print(f"[Email] Sending failed: {e}")

        response_serializer = OrderSerializer(order, context={'request': request})
        return Response(response_serializer.data, status=status.HTTP_201_CREATED)


class OrderDetailView(generics.RetrieveAPIView):
    queryset = Order.objects.all()
    serializer_class = OrderSerializer
    permission_classes = [AllowAny]
    lookup_field = 'order_number'


class AdminOrderListView(generics.ListAPIView):
    serializer_class = OrderListSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        qs = Order.objects.select_related('customer')
        params = self.request.query_params
        status_filter = params.get('status', '')
        search = params.get('search', '')
        if status_filter:
            qs = qs.filter(order_status=status_filter)
        if search:
            qs = qs.filter(
                order_number__icontains=search
            ) | qs.filter(customer__name__icontains=search)
        return qs.distinct()


class AdminOrderDetailView(generics.RetrieveAPIView):
    queryset = Order.objects.all()
    serializer_class = OrderSerializer
    permission_classes = [IsAuthenticated]


class AdminUpdateOrderStatusView(APIView):
    permission_classes = [IsAuthenticated]

    def patch(self, request, pk):
        try:
            order = Order.objects.get(pk=pk)
        except Order.DoesNotExist:
            return Response({'error': 'Order not found'}, status=status.HTTP_404_NOT_FOUND)

        order_status = request.data.get('order_status')
        payment_status = request.data.get('payment_status')

        valid_order_statuses = ['new', 'confirmed', 'packed', 'shipped', 'delivered', 'cancelled']
        valid_payment_statuses = ['pending', 'paid', 'failed', 'refunded']

        if order_status and order_status in valid_order_statuses:
            order.order_status = order_status
        if payment_status and payment_status in valid_payment_statuses:
            order.payment_status = payment_status

        order.save()
        serializer = OrderSerializer(order, context={'request': request})
        return Response(serializer.data)


class InvoiceDownloadView(APIView):
    permission_classes = [AllowAny]

    def get(self, request, order_number):
        try:
            order = Order.objects.get(order_number=order_number)
        except Order.DoesNotExist:
            raise Http404

        if not order.invoice_path:
            # Try to regenerate
            try:
                path = generate_invoice_pdf(order)
                order.invoice_path = path
                order.save(update_fields=['invoice_path'])
            except Exception:
                raise Http404

        full_path = os.path.join(settings.MEDIA_ROOT, str(order.invoice_path))
        if not os.path.exists(full_path):
            try:
                path = generate_invoice_pdf(order)
                order.invoice_path = path
                order.save(update_fields=['invoice_path'])
                full_path = os.path.join(settings.MEDIA_ROOT, str(order.invoice_path))
            except Exception:
                raise Http404

        try:
            response = FileResponse(
                open(full_path, 'rb'),
                content_type='application/pdf'
            )
            response['Content-Disposition'] = f'attachment; filename="{order.invoice_number}.pdf"'
            return response
        except Exception:
            raise Http404



class AdminSendInvoiceEmailView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        try:
            order = Order.objects.get(pk=pk)
        except Order.DoesNotExist:
            return Response({'error': 'Order not found'}, status=status.HTTP_404_NOT_FOUND)

        try:
            from utils.email_utils import _send_customer_email
            _send_customer_email(order)
            return Response({'message': 'Invoice email sent.'})
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class OrderStatsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        from django.db.models import Sum, Count
        stats = Order.objects.aggregate(
            total_orders=Count('id'),
            total_value=Sum('total'),
        )
        new_orders = Order.objects.filter(order_status='new').count()
        confirmed = Order.objects.filter(order_status='confirmed').count()
        delivered = Order.objects.filter(order_status='delivered').count()

        return Response({
            'total_orders': stats['total_orders'] or 0,
            'total_value': float(stats['total_value'] or 0),
            'new_orders': new_orders,
            'confirmed_orders': confirmed,
            'delivered_orders': delivered,
        })


class CustomerOrderHistoryView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        email = request.query_params.get('email', '').strip()
        mobile = request.query_params.get('mobile', '').strip()

        if request.user and request.user.is_authenticated and hasattr(request.user, 'email'):
            if request.user.email:
                email = request.user.email

        if not email and not mobile:
            return Response({'error': 'Email or mobile parameter required'}, status=400)

        orders = Order.objects.none()
        if email:
            orders = Order.objects.filter(customer__email__iexact=email)
        elif mobile:
            orders = Order.objects.filter(customer__mobile=mobile)

        serializer = OrderSerializer(orders.order_by('-created_at'), many=True, context={'request': request})
        return Response(serializer.data)

