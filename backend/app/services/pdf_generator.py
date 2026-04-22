"""PDF generation service — Norwegian-style invoice + climate report.

Public API:
    generate_invoice_pdf(invoice, lines, report) -> bytes
"""

from __future__ import annotations

import io
from typing import Any

from reportlab.graphics.shapes import Drawing, String, Wedge
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import cm
from reportlab.platypus import (
    HRFlowable,
    PageBreak,
    Paragraph,
    SimpleDocTemplate,
    Spacer,
    Table,
    TableStyle,
)

from app.models.generated_invoice import GeneratedInvoice
from app.models.invoice_line import InvoiceLine

# ── Page dimensions ────────────────────────────────────────────────────────────
_W, _ = A4
_MARGIN = 2.2 * cm
_CONTENT_W = _W - 2 * _MARGIN

# ── Colours ────────────────────────────────────────────────────────────────────
_BLACK = colors.black
_DARK = colors.HexColor("#1a1a1a")
_GRAY = colors.HexColor("#555555")
_LIGHT_GRAY = colors.HexColor("#f5f5f5")
_MID_GRAY = colors.HexColor("#cccccc")
_GREEN = colors.HexColor("#16a34a")

# Category colours matching frontend CSS variables
_CAT_COLORS = {
    "materials": colors.HexColor("#3b82f6"),
    "transport": colors.HexColor("#f97316"),
    "waste":     colors.HexColor("#d946ef"),
    "energy":    colors.HexColor("#eab308"),
}
_CATS = [
    ("materials", "Materialer"),
    ("transport", "Transport"),
    ("waste",     "Avfall"),
    ("energy",    "Energi"),
]

# ── Styles ─────────────────────────────────────────────────────────────────────
_base = getSampleStyleSheet()


def _s(name: str, **kw) -> ParagraphStyle:
    return ParagraphStyle(name, parent=_base["Normal"], **kw)


_LOGO     = _s("Logo",     fontSize=22, fontName="Helvetica-Bold",   leading=26, textColor=_DARK)
_SMALL    = _s("Small",    fontSize=8,  fontName="Helvetica",        leading=10, textColor=_GRAY)
_SMALL_I  = _s("SmallI",   fontSize=8,  fontName="Helvetica-Oblique", leading=10, textColor=_GRAY)
_BODY     = _s("Body",     fontSize=9,  fontName="Helvetica",        leading=12, textColor=_DARK)
_BODY_B   = _s("BodyB",    fontSize=9,  fontName="Helvetica-Bold",   leading=12, textColor=_DARK)
_HEADING  = _s("Heading",  fontSize=11, fontName="Helvetica-Bold",   leading=14, textColor=_DARK)
_H_GREEN  = _s("HGreen",   fontSize=18, fontName="Helvetica-Bold",   leading=22, textColor=_GREEN, spaceAfter=4)
_H2       = _s("H2",       fontSize=11, fontName="Helvetica-Bold",   leading=14, textColor=_DARK, spaceBefore=12, spaceAfter=3)
_DETAIL   = _s("Detail",   fontSize=8,  fontName="Helvetica",        leading=10, textColor=_GRAY)
_CELL     = _s("Cell",     fontSize=8,  fontName="Helvetica",        leading=10, textColor=_DARK)

# ── Number formatting ──────────────────────────────────────────────────────────

def _fmt(val: Any, decimals: int = 2) -> str:
    if val is None:
        return "—"
    try:
        n = float(val)
        s = f"{n:,.{decimals}f}"
        s = s.replace(",", " ")
        s = s.replace(".", ",")
        return s
    except (TypeError, ValueError):
        return str(val)


def _fmt_qty(val: Any) -> str:
    if val is None:
        return "—"
    try:
        n = float(val)
        return str(int(n)) if n == int(n) else _fmt(val, 2)
    except (TypeError, ValueError):
        return str(val)


def _str(val: Any) -> str:
    return str(val) if val is not None else "—"


def _pct(val: Any) -> str:
    """Format a 0–100 confidence score as a percentage string."""
    if val is None:
        return "—"
    try:
        return f"{float(val):.0f} %"
    except (TypeError, ValueError):
        return str(val)


# ── Page-level drawing callbacks ───────────────────────────────────────────────

def _noop_page(canvas, doc):
    pass


def _make_invoice_page_cb(footer_text: str):
    def _cb(canvas, doc):
        canvas.saveState()
        canvas.setFont("Helvetica-Bold", 8)
        canvas.setFillColorRGB(0.25, 0.25, 0.25)
        canvas.drawCentredString(_W / 2, 1.4 * cm, footer_text)
        canvas.restoreState()
    return _cb


# ── Invoice page: section builders ────────────────────────────────────────────

def _header_block(invoice: GeneratedInvoice) -> Table:
    left = Paragraph(
        "Retur:<br/>Byggspor AS<br/>Prosjektstyring med CO2-sporbarhet",
        _SMALL,
    )
    right = Paragraph("Byggspor", _LOGO)
    t = Table([[left, right]], colWidths=[_CONTENT_W * 0.6, _CONTENT_W * 0.4])
    t.setStyle(TableStyle([
        ("VALIGN",        (0, 0), (-1, -1), "TOP"),
        ("ALIGN",         (1, 0), (1, 0),   "RIGHT"),
        ("LEFTPADDING",   (0, 0), (-1, -1), 0),
        ("RIGHTPADDING",  (0, 0), (-1, -1), 0),
        ("TOPPADDING",    (0, 0), (-1, -1), 0),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 0),
    ]))
    return t


def _customer_payment_block(invoice: GeneratedInvoice) -> Table:
    name    = _str(invoice.customer_name)
    address = _str(invoice.customer_address)
    email   = invoice.customer_email or ""
    lines   = [f"<b>{name}</b>", address]
    if email:
        lines.append(email)
    customer_para = Paragraph("<br/>".join(lines), _BODY)

    inv_num  = invoice.invoice_number or "Kladd"
    due_str  = invoice.due_date.strftime("%d.%m.%Y") if invoice.due_date else "—"
    gen_str  = invoice.generated_at.strftime("%d.%m.%Y") if invoice.generated_at else "—"
    total    = _fmt(invoice.grand_total_kr)
    bank     = _str(invoice.bank_account)
    their_ref = _str(invoice.their_reference) if invoice.their_reference else None

    box_w = _CONTENT_W * 0.46
    col_a = box_w * 0.48
    col_b = box_w * 0.52

    highlighted = [
        [Paragraph("<b>Forfallsdato</b>", _BODY),  Paragraph(f"<b>{due_str}</b>", _BODY)],
        [Paragraph("<b>Kontonr.</b>",     _BODY),  Paragraph(f"<b>{bank}</b>",    _BODY)],
        [Paragraph("<b>Å betale</b>",     _BODY_B), Paragraph(f"<b>{total}</b>",  _BODY_B)],
    ]
    detail = [
        [Paragraph("Fakturanr.", _BODY), Paragraph(inv_num,  _BODY)],
        [Paragraph("Dato",       _BODY), Paragraph(gen_str,  _BODY)],
    ]
    if their_ref:
        detail.append([Paragraph("Kundenr.", _BODY), Paragraph(their_ref, _BODY)])
    detail.append([
        Paragraph("Vennligst oppgi fakturanummer ved betaling", _SMALL_I),
        "",
    ])

    box_data  = highlighted + [[" ", " "]] + detail
    n_hi      = len(highlighted)

    box = Table(box_data, colWidths=[col_a, col_b])
    box.setStyle(TableStyle([
        ("BACKGROUND",    (0, 0),           (-1, n_hi - 1),           _LIGHT_GRAY),
        ("LINEBELOW",     (0, n_hi - 1),    (-1, n_hi - 1),           0.4, _MID_GRAY),
        ("TOPPADDING",    (0, n_hi),        (-1, n_hi),               2),
        ("BOTTOMPADDING", (0, n_hi),        (-1, n_hi),               2),
        ("BACKGROUND",    (0, n_hi + 1),    (-1, -1),                 colors.white),
        ("SPAN",          (0, -1),          (-1, -1)),
        ("FONTSIZE",      (0, 0),           (-1, -1),                 9),
        ("LEFTPADDING",   (0, 0),           (-1, -1),                 6),
        ("RIGHTPADDING",  (0, 0),           (-1, -1),                 6),
        ("TOPPADDING",    (0, 0),           (-1, n_hi - 1),           4),
        ("BOTTOMPADDING", (0, 0),           (-1, n_hi - 1),           4),
        ("TOPPADDING",    (0, n_hi + 1),    (-1, -1),                 3),
        ("BOTTOMPADDING", (0, n_hi + 1),    (-1, -1),                 3),
        ("VALIGN",        (0, 0),           (-1, -1),                 "MIDDLE"),
    ]))

    outer = Table(
        [[customer_para, box]],
        colWidths=[_CONTENT_W * 0.5, _CONTENT_W * 0.5],
    )
    outer.setStyle(TableStyle([
        ("VALIGN",        (0, 0), (-1, -1), "TOP"),
        ("LEFTPADDING",   (0, 0), (-1, -1), 0),
        ("RIGHTPADDING",  (0, 0), (-1, -1), 0),
        ("TOPPADDING",    (0, 0), (-1, -1), 0),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 0),
        ("ALIGN",         (1, 0), (1, 0),   "RIGHT"),
    ]))
    return outer


def _line_items_table(lines: list[InvoiceLine]) -> Table:
    rows = [["Beskrivelse", "Enhetspris", "Antall", "Sum"]]
    for ln in lines:
        rows.append([
            _str(ln.description),
            _fmt(ln.unit_price_kr),
            _fmt_qty(ln.quantity),
            _fmt(ln.line_total_kr),
        ])
    if len(rows) == 1:
        rows.append(["Ingen linjer", "", "", ""])

    cw = _CONTENT_W
    t = Table(rows, colWidths=[cw * 0.54, cw * 0.20, cw * 0.10, cw * 0.16])
    t.setStyle(TableStyle([
        ("FONTNAME",      (0, 0), (-1, 0),   "Helvetica-Bold"),
        ("FONTSIZE",      (0, 0), (-1, -1),  9),
        ("LINEBELOW",     (0, 0), (-1, 0),   0.5, _BLACK),
        ("ALIGN",         (1, 0), (-1, -1),  "RIGHT"),
        ("ALIGN",         (0, 0), (0, -1),   "LEFT"),
        ("TOPPADDING",    (0, 0), (-1, -1),  4),
        ("BOTTOMPADDING", (0, 0), (-1, -1),  4),
        ("LEFTPADDING",   (0, 0), (-1, -1),  0),
        ("RIGHTPADDING",  (0, 0), (-1, -1),  0),
        ("ROWBACKGROUNDS",(0, 1), (-1, -1),  [colors.white, colors.HexColor("#fafafa")]),
    ]))
    return t


def _total_block(invoice: GeneratedInvoice) -> Table:
    data = [["", "Å betale", _fmt(invoice.grand_total_kr)]]
    cw = _CONTENT_W
    t = Table(data, colWidths=[cw * 0.54, cw * 0.30, cw * 0.16])
    t.setStyle(TableStyle([
        ("FONTNAME",      (1, 0), (-1, 0),  "Helvetica-Bold"),
        ("FONTSIZE",      (0, 0), (-1, -1), 9),
        ("LINEABOVE",     (0, 0), (-1, 0),  0.5, _MID_GRAY),
        ("ALIGN",         (1, 0), (-1, -1), "RIGHT"),
        ("TOPPADDING",    (0, 0), (-1, -1), 6),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
        ("LEFTPADDING",   (0, 0), (-1, -1), 0),
        ("RIGHTPADDING",  (0, 0), (-1, -1), 0),
    ]))
    return t


# ── KPI overview page ─────────────────────────────────────────────────────────

def _donut_chart(report: dict, size: float = 190.0) -> Drawing:
    cats = report.get("categories", {})
    data: list[float] = []
    slice_colors: list = []
    for key, _ in _CATS:
        val = float(cats.get(key, {}).get("total_co2_kg") or 0)
        if val > 0:
            data.append(val)
            slice_colors.append(_CAT_COLORS[key])

    d = Drawing(size, size)
    if not data:
        return d

    cx = size / 2
    cy = size / 2
    r_outer = size * 0.43
    r_inner = r_outer * 0.60

    total_slice = sum(data)
    current = 90.0  # start at 12 o'clock

    for val, color in zip(data, slice_colors):
        sweep = 360.0 * val / total_slice
        w = Wedge(
            cx, cy, r_outer,
            current - sweep, current,
            radius1=r_inner,
            fillColor=color,
            strokeColor=colors.white,
            strokeWidth=1.5,
        )
        d.add(w)
        current -= sweep

    total_co2 = report.get("total_co2_kg")
    if total_co2 is not None:
        d.add(String(
            cx, cy + 5, _fmt(total_co2, 1),
            textAnchor="middle", fontSize=9,
            fontName="Helvetica-Bold", fillColor=_DARK,
        ))
        d.add(String(
            cx, cy - 8, "kg CO2e",
            textAnchor="middle", fontSize=7,
            fontName="Helvetica", fillColor=_GRAY,
        ))

    return d


def _kpi_summary_table(report: dict, col_w: float) -> Table:
    cats = report.get("categories", {})
    swatch_w = 0.3 * cm
    rem = col_w - swatch_w

    rows: list = [[
        "",
        Paragraph("<b>Kategori</b>", _BODY_B),
        Paragraph("<b>CO2-ekv. (kg)</b>", _BODY_B),
        Paragraph("<b>Konfidens</b>", _BODY_B),
    ]]

    for key, label in _CATS:
        cat = cats.get(key, {})
        rows.append([
            "",
            Paragraph(label, _BODY),
            Paragraph(_fmt(cat.get("total_co2_kg")), _BODY),
            Paragraph(_pct(cat.get("avg_confidence")), _BODY),
        ])

    rows.append([
        "",
        Paragraph("<b>Totalt</b>", _BODY_B),
        Paragraph(f"<b>{_fmt(report.get('total_co2_kg'))}</b>", _BODY_B),
        Paragraph("", _BODY),
    ])

    n = len(rows)
    t = Table(rows, colWidths=[swatch_w, rem * 0.44, rem * 0.35, rem * 0.21])
    t.setStyle(TableStyle([
        # Alternating row backgrounds for data rows (cols 1+)
        ("ROWBACKGROUNDS", (1, 1), (-1, -2), [colors.white, colors.HexColor("#f3f4f6")]),
        # Color swatches — override column 0 per row
        ("BACKGROUND", (0, 1), (0, 1), _CAT_COLORS["materials"]),
        ("BACKGROUND", (0, 2), (0, 2), _CAT_COLORS["transport"]),
        ("BACKGROUND", (0, 3), (0, 3), _CAT_COLORS["waste"]),
        ("BACKGROUND", (0, 4), (0, 4), _CAT_COLORS["energy"]),
        # Total row
        ("BACKGROUND", (1, n - 1), (-1, n - 1), _LIGHT_GRAY),
        # Typography & borders
        ("FONTSIZE",      (0, 0), (-1, -1),  9),
        ("LINEBELOW",     (1, 0), (-1, 0),   0.5, _BLACK),
        ("LINEABOVE",     (0, n - 1), (-1, n - 1), 0.5, _MID_GRAY),
        ("ALIGN",         (2, 0), (-1, -1),  "RIGHT"),
        ("ALIGN",         (0, 0), (1, -1),   "LEFT"),
        ("TOPPADDING",    (0, 0), (-1, -1),  5),
        ("BOTTOMPADDING", (0, 0), (-1, -1),  5),
        ("LEFTPADDING",   (1, 0), (-1, -1),  4),
        ("RIGHTPADDING",  (0, 0), (-1, -1),  4),
        ("LEFTPADDING",   (0, 0), (0, -1),   0),
        ("RIGHTPADDING",  (0, 0), (0, -1),   0),
    ]))
    return t


def _kpi_page(report: dict) -> list:
    left_w = _CONTENT_W * 0.42
    right_w = _CONTENT_W * 0.58
    chart_size = left_w - 0.5 * cm

    chart = _donut_chart(report, size=chart_size)
    kpi = _kpi_summary_table(report, right_w)

    layout = Table([[chart, kpi]], colWidths=[left_w, right_w])
    layout.setStyle(TableStyle([
        ("VALIGN",        (0, 0), (-1, -1), "MIDDLE"),
        ("LEFTPADDING",   (0, 0), (-1, -1), 0),
        ("RIGHTPADDING",  (0, 0), (-1, -1), 0),
        ("TOPPADDING",    (0, 0), (-1, -1), 0),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 0),
    ]))

    return [
        Paragraph("Klimaoversikt", _H_GREEN),
        Paragraph(
            f"Totalt prosjektutslipp: <b>{_fmt(report.get('total_co2_kg'))} kg CO2-ekv.</b>",
            _BODY_B,
        ),
        Spacer(1, 0.5 * cm),
        layout,
        Spacer(1, 0.4 * cm),
    ]


# ── Climate report: section builders ──────────────────────────────────────────

def _base_table_style() -> TableStyle:
    return TableStyle([
        ("BACKGROUND",    (0, 0), (-1, 0),   _GREEN),
        ("TEXTCOLOR",     (0, 0), (-1, 0),   colors.white),
        ("FONTNAME",      (0, 0), (-1, 0),   "Helvetica-Bold"),
        ("FONTSIZE",      (0, 0), (-1, -1),  8),
        ("LEADING",       (0, 0), (-1, -1),  10),
        ("ROWBACKGROUNDS",(0, 1), (-1, -1),  [colors.white, colors.HexColor("#f3f4f6")]),
        ("GRID",          (0, 0), (-1, -1),  0.25, _MID_GRAY),
        ("VALIGN",        (0, 0), (-1, -1),  "MIDDLE"),
        ("TOPPADDING",    (0, 0), (-1, -1),  3),
        ("BOTTOMPADDING", (0, 0), (-1, -1),  3),
        ("LEFTPADDING",   (0, 0), (-1, -1),  5),
        ("RIGHTPADDING",  (0, 0), (-1, -1),  5),
    ])


def _detail_table(rows: list[list], col_widths: list) -> list:
    if len(rows) == 1:
        rows.append(["Ingen data"] + [""] * (len(rows[0]) - 1))
    t = Table(rows, colWidths=col_widths, repeatRows=1)
    t.setStyle(_base_table_style())
    return [t, Spacer(1, 0.3 * cm)]


def _materials_table(items: list[dict]) -> list:
    headers = ["Produkt", "EPD-nr.", "Mengde", "GWP/enhet (A1-3)", "Total CO2 (kg)", "Konfidens"]
    rows = [headers] + [[
        Paragraph(_str(it.get("product_name")), _CELL),
        Paragraph(_str(it.get("epd_id")), _CELL),
        f'{_fmt(it.get("quantity"))} {_str(it.get("unit"))}',
        _fmt(it.get("gwp_per_unit"), 4),
        _fmt(it.get("total_co2_kg")),
        _pct(it.get("confidence_score")),
    ] for it in items]
    return _detail_table(rows, [4.8 * cm, 2.8 * cm, 1.9 * cm, 3.0 * cm, 2.3 * cm, 1.8 * cm])


def _transport_table(items: list[dict]) -> list:
    headers = ["Kjøretøy", "Fra → Til", "Km", "CO2 (kg)", "Konfidens"]
    rows = [headers]
    for it in items:
        v = it.get("vehicle") or {}
        vehicle = " ".join(filter(None, [v.get("make"), v.get("model")])) or "—"
        rows.append([
            vehicle,
            f"{_str(it.get('start_address'))} - {_str(it.get('end_address'))}",
            _fmt(it.get("distance_km")),
            _fmt(it.get("total_co2_kg")),
            _pct(it.get("confidence_score")),
        ])
    return _detail_table(rows, [3.5 * cm, 6.6 * cm, 1.5 * cm, 2.6 * cm, 2.4 * cm])


def _waste_table(items: list[dict]) -> list:
    headers = ["Avfallstype", "Mengde", "Enhet", "CO2 (kg)", "Konfidens"]
    rows = [headers] + [[
        _str(it.get("waste_type")),
        _fmt(it.get("quantity")),
        _str(it.get("unit")),
        _fmt(it.get("total_co2_kg")),
        _pct(it.get("confidence_score")),
    ] for it in items]
    return _detail_table(rows, [5.5 * cm, 2.5 * cm, 1.5 * cm, 3.5 * cm, 3.6 * cm])


def _energy_table(items: list[dict]) -> list:
    headers = ["Prissone", "kWh", "Emisjonsfaktor (kg CO2eq/kWh)", "CO2 (kg)", "Dato"]
    rows = [headers] + [[
        _str(it.get("price_zone")),
        _fmt(it.get("kwh_used")),
        _fmt(it.get("grid_emission_factor"), 4),
        _fmt(it.get("total_co2_kg")),
        _str(it.get("recorded_date")),
    ] for it in items]
    return _detail_table(rows, [2.5 * cm, 2.5 * cm, 4.5 * cm, 3.1 * cm, 4.0 * cm])



def _category_section(label: str, cat: dict, table_fn) -> list:
    items = cat.get("items", [])
    flowables = [
        Paragraph(label, _H2),
        Paragraph(
            f"Totalt: <b>{_fmt(cat.get('total_co2_kg'))} kg CO2-ekv.</b>"
            f"&nbsp;|&nbsp;Antall poster: <b>{cat.get('entry_count', 0)}</b>"
            f"&nbsp;|&nbsp;Konfidens: <b>{_pct(cat.get('avg_confidence'))}</b>",
            _DETAIL,
        ),
        Spacer(1, 0.2 * cm),
    ]
    flowables.extend(table_fn(items))
    return flowables


def _methodology_notes(settings: dict) -> list:
    if not settings:
        return []
    lines = ["<b>Metode og innstillinger</b>"]
    for key, label in [
        ("gwp_stages",               "GWP-stadier"),
        ("energy_grid",              "Strømnett"),
        ("transport_co2_source",     "Transportutslippskilde"),
        ("waste_calculation_method", "Avfallsberegning"),
        ("confidence_weighting",     "Konfidensvegging"),
    ]:
        if val := settings.get(key):
            lines.append(f"{label}: {val}")
    return [
        HRFlowable(width="100%", thickness=0.5, color=_MID_GRAY, spaceAfter=6),
        Paragraph("<br/>".join(lines), _DETAIL),
    ]


# ── Public API ─────────────────────────────────────────────────────────────────

def generate_invoice_pdf(
    invoice: GeneratedInvoice,
    lines: list[InvoiceLine],
    report: dict,
) -> bytes:
    """Render Norwegian-style invoice + climate report to PDF bytes."""
    buf = io.BytesIO()

    doc = SimpleDocTemplate(
        buf,
        pagesize=A4,
        leftMargin=_MARGIN,
        rightMargin=_MARGIN,
        topMargin=2 * cm,
        bottomMargin=2.5 * cm,
    )

    footer_text = "Byggspor AS  |  NO 123 456 789"
    on_first_page = _make_invoice_page_cb(footer_text)

    story: list = []

    # ── Page 1: Invoice ────────────────────────────────────────────────────────
    story.append(_header_block(invoice))
    story.append(Spacer(1, 0.3 * cm))
    story.append(HRFlowable(width="100%", thickness=0.5, color=_MID_GRAY, spaceAfter=8))

    story.append(_customer_payment_block(invoice))
    story.append(Spacer(1, 0.7 * cm))

    story.append(Paragraph("FAKTURA", _HEADING))
    if invoice.our_reference:
        story.append(Paragraph(invoice.our_reference, _BODY))
    story.append(Spacer(1, 0.4 * cm))

    story.append(_line_items_table(lines))
    story.append(_total_block(invoice))
    story.append(Spacer(1, 0.3 * cm))
    story.append(Paragraph("Alle beløp er oppgitt i NOK", _SMALL_I))

    # ── Page 2: KPI overview + donut chart ────────────────────────────────────
    story.append(PageBreak())
    story.extend(_kpi_page(report))

    # ── Page 3+: Detailed climate report ──────────────────────────────────────
    story.append(PageBreak())
    story.append(Paragraph("Klimarapport — Detaljerte utslipp per kategori", _H_GREEN))
    story.append(Spacer(1, 0.4 * cm))

    cats = report.get("categories", {})
    for label, key, table_fn in [
        ("Materialer", "materials", _materials_table),
        ("Transport",  "transport", _transport_table),
        ("Avfall",     "waste",     _waste_table),
        ("Energi",     "energy",    _energy_table),
    ]:
        cat = cats.get(key, {"total_co2_kg": 0, "entry_count": 0, "avg_confidence": None, "items": []})
        story.extend(_category_section(label, cat, table_fn))

    story.extend(_methodology_notes(report.get("settings", {})))

    doc.build(story, onFirstPage=on_first_page, onLaterPages=_noop_page)
    return buf.getvalue()
