import os
from io import BytesIO
from datetime import datetime
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import mm, cm
from reportlab.platypus import (
    SimpleDocTemplate, Table, TableStyle, Paragraph,
    Spacer, HRFlowable, Image as RLImage
)
from reportlab.lib.enums import TA_CENTER, TA_RIGHT, TA_LEFT
from django.conf import settings


def create_qr_code(data, size=70):
    """Generate a ReportLab Drawing containing a QR code for the invoice."""
    try:
        from reportlab.graphics.barcode.qr import QrCodeWidget
        from reportlab.graphics.shapes import Drawing
        qr = QrCodeWidget(value=data)
        bounds = qr.getBounds()
        w = bounds[2] - bounds[0]
        h = bounds[3] - bounds[1]
        drawing = Drawing(size, size, transform=[size / w, 0, 0, size / h, 0, 0])
        drawing.add(qr)
        return drawing
    except Exception:
        try:
            import qrcode
            img = qrcode.make(data)
            buf = BytesIO()
            img.save(buf, format='PNG')
            buf.seek(0)
            return RLImage(buf, width=size, height=size)
        except Exception:
            return None


def generate_invoice_pdf(order):
    """Generate a professional invoice PDF for the given order and save it."""

    # Ensure invoices directory exists
    invoice_dir = os.path.join(settings.MEDIA_ROOT, 'invoices')
    os.makedirs(invoice_dir, exist_ok=True)

    filename = f"{order.invoice_number}.pdf"
    filepath = os.path.join(invoice_dir, filename)

    buffer = BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        rightMargin=2 * cm,
        leftMargin=2 * cm,
        topMargin=1.5 * cm,
        bottomMargin=1.5 * cm,
    )

    from core.models import BusinessSettings
    biz = BusinessSettings.get_settings()

    styles = getSampleStyleSheet()
    brand_color = colors.HexColor('#111111')
    accent_color = colors.HexColor('#c8a96e')
    light_gray = colors.HexColor('#f5f5f5')
    mid_gray = colors.HexColor('#888888')

    title_style = ParagraphStyle(
        'TitleStyle', parent=styles['Normal'],
        fontSize=28, textColor=brand_color,
        fontName='Helvetica-Bold', spaceAfter=2
    )
    subtitle_style = ParagraphStyle(
        'SubtitleStyle', parent=styles['Normal'],
        fontSize=10, textColor=mid_gray,
        fontName='Helvetica', spaceAfter=2
    )
    heading_style = ParagraphStyle(
        'HeadingStyle', parent=styles['Normal'],
        fontSize=11, textColor=brand_color,
        fontName='Helvetica-Bold', spaceAfter=4
    )
    normal_style = ParagraphStyle(
        'NormalStyle', parent=styles['Normal'],
        fontSize=9, textColor=brand_color,
        fontName='Helvetica', spaceAfter=2, leading=14
    )
    small_style = ParagraphStyle(
        'SmallStyle', parent=styles['Normal'],
        fontSize=8, textColor=mid_gray,
        fontName='Helvetica', spaceAfter=2
    )
    right_style = ParagraphStyle(
        'RightStyle', parent=styles['Normal'],
        fontSize=9, textColor=brand_color,
        fontName='Helvetica', alignment=TA_RIGHT
    )
    center_style = ParagraphStyle(
        'CenterStyle', parent=styles['Normal'],
        fontSize=9, textColor=brand_color,
        fontName='Helvetica', alignment=TA_CENTER
    )

    story = []

    # ── Header ──────────────────────────────────────────────────────────────
    logo_cell = ''
    logo_path = None
    if biz.logo:
        try:
            logo_path = os.path.join(settings.MEDIA_ROOT, biz.logo.name)
            if os.path.exists(logo_path):
                logo_cell = RLImage(logo_path, width=3 * cm, height=3 * cm)
        except Exception:
            logo_cell = ''

    biz_info = f"""<b><font size="16">{biz.business_name}</font></b><br/>
<font size="8" color="#888888">{biz.business_address or ''}</font><br/>
<font size="8" color="#888888">{biz.business_email}</font><br/>
<font size="8" color="#888888">{biz.business_phone or ''}</font>"""

    invoice_info = f"""<font size="20" color="#111111"><b>INVOICE</b></font><br/>
<font size="9" color="#888888">Invoice #: <b>{order.invoice_number}</b></font><br/>
<font size="9" color="#888888">Order #: <b>{order.order_number}</b></font><br/>
<font size="9" color="#888888">Date: <b>{order.created_at.strftime('%d %B %Y')}</b></font>"""

    header_data = [
        [
            logo_cell if logo_cell else Paragraph(biz.business_name, title_style),
            Paragraph(biz_info, normal_style),
            Paragraph(invoice_info, right_style),
        ]
    ]
    header_table = Table(header_data, colWidths=[3.5 * cm, 8.5 * cm, 5 * cm])
    header_table.setStyle(TableStyle([
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('ALIGN', (2, 0), (2, 0), 'RIGHT'),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
    ]))
    story.append(header_table)
    story.append(HRFlowable(width='100%', thickness=2, color=accent_color, spaceAfter=12))

    # ── Bill To / Order Status / QR Code ─────────────────────────────────────
    customer = order.customer
    bill_to = f"""<b>Bill To:</b><br/>
<b>{customer.name}</b><br/>
{customer.mobile}<br/>
{customer.email or ''}<br/>
{customer.address}<br/>
{customer.city}, {customer.state} - {customer.pincode}"""

    status_color = '#27ae60' if order.order_status == 'delivered' else '#e67e22'
    payment_color = '#27ae60' if order.payment_status == 'paid' else '#e74c3c'
    order_detail = f"""<b>Order Status:</b><br/>
<font color="{status_color}"><b>{order.get_order_status_display().upper()}</b></font><br/><br/>
<b>Payment Status:</b><br/>
<font color="{payment_color}"><b>{order.get_payment_status_display().upper()}</b></font>"""

    # Generate QR Code (WhatsApp / Payment / Order Verification URL)
    whatsapp_num = biz.whatsapp_number or ''
    if whatsapp_num:
        qr_url = f"https://wa.me/{whatsapp_num}?text=Invoice%3A%20{order.invoice_number}%20%7C%20Order%3A%20{order.order_number}%20%7C%20Amount%3A%20Rs.{order.total}"
    else:
        qr_url = f"Order:{order.order_number}|Invoice:{order.invoice_number}|Amount:{order.total}"

    qr_drawing = create_qr_code(qr_url, size=65)

    qr_cell_content = []
    if qr_drawing:
        qr_cell_content.append(qr_drawing)
        qr_cell_content.append(Spacer(1, 2))
        qr_cell_content.append(Paragraph('<font size="7" color="#555555"><b>Scan to Verify / Pay</b></font>', center_style))
    else:
        qr_cell_content.append(Paragraph('', normal_style))

    info_data = [[
        Paragraph(bill_to, normal_style),
        Paragraph(order_detail, normal_style),
        qr_cell_content
    ]]
    info_table = Table(info_data, colWidths=[7.5 * cm, 5.5 * cm, 4 * cm])
    info_table.setStyle(TableStyle([
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('ALIGN', (2, 0), (2, 0), 'CENTER'),
        ('BACKGROUND', (0, 0), (-1, -1), light_gray),
        ('BOX', (0, 0), (-1, -1), 0.5, colors.HexColor('#dddddd')),
        ('PADDING', (0, 0), (-1, -1), 8),
    ]))
    story.append(info_table)
    story.append(Spacer(1, 16))

    # ── Items Table ──────────────────────────────────────────────────────────
    story.append(Paragraph('Order Items', heading_style))
    story.append(Spacer(1, 4))

    col_headers = ['Product', 'Size', 'Color', 'Qty', 'Unit Price', 'Discount', 'Subtotal']
    table_data = [col_headers]

    for item in order.items.all():
        unit_price = f"Rs. {item.price:,.2f}"
        discount = f"Rs. {item.discount_price:,.2f}" if item.discount_price else '-'
        subtotal = f"Rs. {item.subtotal:,.2f}"
        table_data.append([
            item.product_name_snapshot,
            item.size,
            item.color,
            str(item.quantity),
            unit_price,
            discount,
            subtotal,
        ])

    items_table = Table(
        table_data,
        colWidths=[4.8 * cm, 1.8 * cm, 2.0 * cm, 1.2 * cm, 2.4 * cm, 2.2 * cm, 2.6 * cm]
    )
    items_table.setStyle(TableStyle([
        # Header row
        ('BACKGROUND', (0, 0), (-1, 0), brand_color),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 9),
        ('ALIGN', (0, 0), (-1, 0), 'CENTER'),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 8),
        ('TOPPADDING', (0, 0), (-1, 0), 8),
        # Data rows
        ('FONTNAME', (0, 1), (-1, -1), 'Helvetica'),
        ('FONTSIZE', (0, 1), (-1, -1), 8),
        ('ALIGN', (1, 1), (-1, -1), 'CENTER'),
        ('ALIGN', (0, 1), (0, -1), 'LEFT'),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, light_gray]),
        ('TOPPADDING', (0, 1), (-1, -1), 7),
        ('BOTTOMPADDING', (0, 1), (-1, -1), 7),
        ('LEFTPADDING', (0, 0), (-1, -1), 8),
        ('RIGHTPADDING', (0, 0), (-1, -1), 8),
        ('GRID', (0, 0), (-1, -1), 0.3, colors.HexColor('#dddddd')),
    ]))
    story.append(items_table)
    story.append(Spacer(1, 16))

    # ── Totals ───────────────────────────────────────────────────────────────
    totals_data = [
        ['', '', 'Subtotal:', f"Rs. {order.subtotal:,.2f}"],
        ['', '', 'Discount:', f"-Rs. {order.discount:,.2f}"],
        ['', '', 'TOTAL:', f"Rs. {order.total:,.2f}"],
    ]
    totals_table = Table(totals_data, colWidths=[5.5 * cm, 5.5 * cm, 3.2 * cm, 2.8 * cm])
    totals_table.setStyle(TableStyle([
        ('ALIGN', (2, 0), (-1, -1), 'RIGHT'),
        ('FONTNAME', (2, 0), (2, 1), 'Helvetica'),
        ('FONTNAME', (2, 2), (-1, 2), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, 1), 9),
        ('FONTSIZE', (0, 2), (-1, 2), 11),
        ('TEXTCOLOR', (2, 2), (-1, 2), accent_color),
        ('LINEABOVE', (2, 2), (-1, 2), 1, brand_color),
        ('TOPPADDING', (0, 0), (-1, -1), 4),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
    ]))
    story.append(totals_table)
    story.append(Spacer(1, 20))

    # ── Order Note ───────────────────────────────────────────────────────────
    if order.order_note:
        story.append(Paragraph(f"<b>Order Note:</b> {order.order_note}", normal_style))
        story.append(Spacer(1, 8))

    # ── Footer ───────────────────────────────────────────────────────────────
    story.append(HRFlowable(width='100%', thickness=1, color=colors.HexColor('#dddddd'), spaceAfter=8))
    footer_text = f"""<font size="8" color="#888888">
Thank you for shopping with {biz.business_name}!
For any queries, contact us at {biz.business_email} or WhatsApp {biz.whatsapp_number}.
</font>"""
    story.append(Paragraph(footer_text, center_style))

    doc.build(story)

    # Save to file
    with open(filepath, 'wb') as f:
        f.write(buffer.getvalue())

    # Return relative path for storage in DB
    return f"invoices/{filename}"


def get_invoice_buffer(order):
    """Return PDF as BytesIO buffer (for email attachment). Always regenerate to ensure latest business info."""
    generate_invoice_pdf(order)
    full_path = os.path.join(settings.MEDIA_ROOT, order.invoice_path)
    with open(full_path, 'rb') as f:
        return BytesIO(f.read())

