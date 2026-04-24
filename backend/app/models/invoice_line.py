from __future__ import annotations

import enum

from sqlalchemy import Enum, ForeignKey, Integer, Numeric, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class InvoiceLineCategory(enum.Enum):
    MATERIAL = "material"
    TRANSPORT = "transport"
    WASTE = "waste"
    ENERGY = "energy"


class InvoiceLineSourceType(enum.Enum):
    PROJECT_MATERIAL = "project_material"
    TRANSPORT = "transport"
    WASTE_ITEM = "waste_item"
    ENERGY = "energy"
    MANUAL = "manual"


class InvoiceLine(Base):
    """A single line on a generated invoice, with CO2 provenance."""

    __tablename__ = "invoice_lines"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    generated_invoice_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("generated_invoices.id", ondelete="CASCADE"), nullable=False
    )
    category: Mapped[InvoiceLineCategory] = mapped_column(
        Enum(
            InvoiceLineCategory,
            name="invoicelinecategory",
            values_callable=lambda obj: [e.value for e in obj],
        ),
        nullable=False,
    )
    description: Mapped[str] = mapped_column(Text, nullable=False)
    quantity: Mapped[float | None] = mapped_column(Numeric(12, 4))
    unit: Mapped[str | None] = mapped_column(String(50))
    unit_price_kr: Mapped[float | None] = mapped_column(Numeric(12, 2))
    vat_rate: Mapped[float | None] = mapped_column(Numeric(5, 4))
    line_total_kr: Mapped[float | None] = mapped_column(Numeric(12, 2))
    total_co2_kg: Mapped[float | None] = mapped_column(Numeric(12, 4))
    confidence_score: Mapped[int | None] = mapped_column(Integer)
    epd_id: Mapped[str | None] = mapped_column(String(255))

    # Provenance back to the originating entry
    source_type: Mapped[InvoiceLineSourceType | None] = mapped_column(
        Enum(
            InvoiceLineSourceType,
            name="invoicelinesourcetype",
            values_callable=lambda obj: [e.value for e in obj],
        )
    )
    source_id: Mapped[int | None] = mapped_column(Integer)

    generated_invoice: Mapped["GeneratedInvoice"] = relationship(back_populates="lines")
