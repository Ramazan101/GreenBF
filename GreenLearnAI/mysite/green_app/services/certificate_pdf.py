# coding: utf-8
"""
Генерация PDF-сертификата через reportlab.
Для кириллицы регистрируется системный шрифт Windows (Arial).
"""
import io
import os
import logging

logger = logging.getLogger('green_app')

_FONT_CANDIDATES = [
    ('GLFont', r'C:\Windows\Fonts\arial.ttf', r'C:\Windows\Fonts\arialbd.ttf'),
    ('GLFont', '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',
     '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf'),
]


def _register_fonts():
    """Зарегистрировать шрифт с поддержкой кириллицы. Вернуть (regular, bold)."""
    from reportlab.pdfbase import pdfmetrics
    from reportlab.pdfbase.ttfonts import TTFont

    for name, regular_path, bold_path in _FONT_CANDIDATES:
        if os.path.exists(regular_path):
            pdfmetrics.registerFont(TTFont(name, regular_path))
            bold_name = name + '-Bold'
            if os.path.exists(bold_path):
                pdfmetrics.registerFont(TTFont(bold_name, bold_path))
            else:
                bold_name = name
            return name, bold_name
    return 'Helvetica', 'Helvetica-Bold'


def generate_certificate_pdf(certificate) -> bytes:
    """Сгенерировать PDF-сертификат (A4 landscape) и вернуть байты."""
    from reportlab.lib.pagesizes import A4, landscape
    from reportlab.lib.colors import HexColor
    from reportlab.pdfgen import canvas

    font, font_bold = _register_fonts()

    buffer = io.BytesIO()
    width, height = landscape(A4)
    pdf = canvas.Canvas(buffer, pagesize=landscape(A4))

    green = HexColor('#16a34a')
    green_dark = HexColor('#14532d')
    muted = HexColor('#64748b')

    # Фон и рамки
    pdf.setFillColor(HexColor('#f0fdf4'))
    pdf.rect(0, 0, width, height, fill=1, stroke=0)
    pdf.setStrokeColor(green)
    pdf.setLineWidth(4)
    pdf.rect(24, 24, width - 48, height - 48, fill=0, stroke=1)
    pdf.setLineWidth(1)
    pdf.rect(34, 34, width - 68, height - 68, fill=0, stroke=1)

    # Заголовок платформы
    pdf.setFillColor(green)
    pdf.setFont(font_bold, 22)
    pdf.drawCentredString(width / 2, height - 90, 'GreenLearnAI')
    pdf.setFillColor(muted)
    pdf.setFont(font, 12)
    pdf.drawCentredString(width / 2, height - 110, 'Платформа добрых дел для детей Кыргызстана')

    # Название документа
    pdf.setFillColor(green_dark)
    pdf.setFont(font_bold, 34)
    pdf.drawCentredString(width / 2, height - 175, 'СЕРТИФИКАТ')

    # Кому выдан
    pdf.setFillColor(muted)
    pdf.setFont(font, 14)
    pdf.drawCentredString(width / 2, height - 215, 'настоящим подтверждается, что')
    pdf.setFillColor(HexColor('#0f172a'))
    pdf.setFont(font_bold, 28)
    pdf.drawCentredString(width / 2, height - 255, certificate.child.name)

    # Звание
    pdf.setFillColor(muted)
    pdf.setFont(font, 14)
    pdf.drawCentredString(width / 2, height - 290, 'получает звание')
    pdf.setFillColor(green)
    pdf.setFont(font_bold, 24)
    pdf.drawCentredString(width / 2, height - 325, f'«{certificate.title}»')

    if certificate.description:
        pdf.setFillColor(muted)
        pdf.setFont(font, 13)
        pdf.drawCentredString(width / 2, height - 355, certificate.description)

    # Дата и код
    pdf.setFillColor(muted)
    pdf.setFont(font, 11)
    pdf.drawCentredString(
        width / 2, 80,
        f'Выдан {certificate.issued_at:%d.%m.%Y} • Код: GL-{certificate.id:06d}'
    )

    pdf.showPage()
    pdf.save()
    return buffer.getvalue()
