import os
from django.core.mail import EmailMessage
from django.conf import settings
from .invoice import get_invoice_buffer


def send_order_emails(order):
    """Send confirmation emails to both customer and business admin."""
    try:
        _send_customer_email(order)
        print(f"📧 [Email Success] Customer email sent to {order.customer.email}")
    except Exception as e:
        print(f"[Email SMTP Warning] Could not send via SMTP ({e}). Logging to console...")
        try:
            from django.core.mail import get_connection
            connection = get_connection('django.core.mail.backends.console.EmailBackend')
            _send_customer_email(order, connection=connection)
        except Exception as err:
            print(f"[Email Error] Console fallback failed: {err}")

    try:
        _send_admin_email(order)
    except Exception as e:
        print(f"[Email Admin] Failed: {e}")


def _send_customer_email(order, connection=None):
    from core.models import BusinessSettings
    biz = BusinessSettings.get_settings()
    customer = order.customer

    if not customer.email:
        return

    items_html = ""
    for item in order.items.all():
        price = item.discount_price if item.discount_price else item.price
        items_html += f"""
        <tr>
          <td style="padding:8px;border-bottom:1px solid #eee;">{item.product_name_snapshot}</td>
          <td style="padding:8px;border-bottom:1px solid #eee;text-align:center;">{item.size}</td>
          <td style="padding:8px;border-bottom:1px solid #eee;text-align:center;">{item.color}</td>
          <td style="padding:8px;border-bottom:1px solid #eee;text-align:center;">{item.quantity}</td>
          <td style="padding:8px;border-bottom:1px solid #eee;text-align:right;">₹{price:,.2f}</td>
          <td style="padding:8px;border-bottom:1px solid #eee;text-align:right;">₹{item.subtotal:,.2f}</td>
        </tr>"""

    html_body = f"""
    <html>
    <body style="font-family:Arial,sans-serif;color:#333;max-width:600px;margin:0 auto;">
      <div style="background:#111;padding:24px;text-align:center;">
        <h1 style="color:#c8a96e;margin:0;font-size:24px;">{biz.business_name}</h1>
      </div>
      <div style="padding:32px;">
        <h2 style="color:#111;">Order Confirmed! 🎉</h2>
        <p>Hi <strong>{customer.name}</strong>,</p>
        <p>Thank you for your order. We've received it and will process it soon.</p>

        <div style="background:#f9f9f9;border-radius:8px;padding:20px;margin:20px 0;">
          <table style="width:100%;border-collapse:collapse;">
            <tr>
              <td style="padding:4px 8px;"><strong>Order ID:</strong></td>
              <td style="padding:4px 8px;">{order.order_number}</td>
            </tr>
            <tr>
              <td style="padding:4px 8px;"><strong>Invoice #:</strong></td>
              <td style="padding:4px 8px;">{order.invoice_number}</td>
            </tr>
            <tr>
              <td style="padding:4px 8px;"><strong>Date:</strong></td>
              <td style="padding:4px 8px;">{order.created_at.strftime('%d %B %Y')}</td>
            </tr>
            <tr>
              <td style="padding:4px 8px;"><strong>Payment:</strong></td>
              <td style="padding:4px 8px;color:#e67e22;">{order.get_payment_status_display()}</td>
            </tr>
          </table>
        </div>

        <h3>Your Order</h3>
        <table style="width:100%;border-collapse:collapse;font-size:14px;">
          <thead>
            <tr style="background:#111;color:#fff;">
              <th style="padding:10px;text-align:left;">Product</th>
              <th style="padding:10px;text-align:center;">Size</th>
              <th style="padding:10px;text-align:center;">Color</th>
              <th style="padding:10px;text-align:center;">Qty</th>
              <th style="padding:10px;text-align:right;">Price</th>
              <th style="padding:10px;text-align:right;">Total</th>
            </tr>
          </thead>
          <tbody>
            {items_html}
          </tbody>
        </table>

        <div style="text-align:right;margin-top:16px;font-size:16px;">
          <strong>Total: ₹{order.total:,.2f}</strong>
        </div>

        <p style="margin-top:24px;">Please find your invoice attached to this email.</p>
        <p>For questions, contact us on WhatsApp: <strong>{biz.whatsapp_number}</strong></p>
        <p style="color:#888;">Thank you for shopping with {biz.business_name}!</p>
      </div>
    </body>
    </html>
    """

    email = EmailMessage(
        subject=f"Order Confirmed – {order.order_number} | {biz.business_name}",
        body=html_body,
        from_email=settings.DEFAULT_FROM_EMAIL,
        to=[customer.email],
        cc=['indianmuslim004@gmail.com'],
        connection=connection
    )
    email.content_subtype = 'html'

    # Attach invoice PDF
    try:
        pdf_buffer = get_invoice_buffer(order)
        email.attach(
            f"{order.invoice_number}.pdf",
            pdf_buffer.getvalue(),
            'application/pdf'
        )
    except Exception as e:
        print(f"[Email] Could not attach invoice: {e}")

    email.send()


def _send_admin_email(order):
    from core.models import BusinessSettings
    biz = BusinessSettings.get_settings()
    customer = order.customer

    items_text = ""
    for item in order.items.all():
        price = item.discount_price if item.discount_price else item.price
        items_text += f"\n  • {item.product_name_snapshot} | Size: {item.size} | Color: {item.color} | Qty: {item.quantity} | ₹{price:,.2f}"

    body = f"""
New Order Received!

Order ID: {order.order_number}
Invoice #: {order.invoice_number}
Date: {order.created_at.strftime('%d %B %Y %H:%M')}

Customer:
  Name: {customer.name}
  Mobile: {customer.mobile}
  Email: {customer.email or 'N/A'}
  Address: {customer.address}, {customer.city}, {customer.state} - {customer.pincode}

Products:{items_text}

Subtotal: ₹{order.subtotal:,.2f}
Discount: -₹{order.discount:,.2f}
Total: ₹{order.total:,.2f}

Payment Status: {order.get_payment_status_display()}
Order Status: {order.get_order_status_display()}
"""

    email = EmailMessage(
        subject=f"[NEW ORDER] {order.order_number} – ₹{order.total:,.2f}",
        body=body,
        from_email=settings.DEFAULT_FROM_EMAIL,
        to=[biz.business_email, 'murshid10032004@gmail.com'],
        cc=['indianmuslim004@gmail.com'],
    )
    email.send()
