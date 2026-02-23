from __future__ import annotations

from datetime import datetime

from sqlalchemy import (
    Boolean,
    DateTime,
    ForeignKey,
    Integer,
    Numeric,
    String,
    Text,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class Material(Base):
    __tablename__ = "materials"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    material_invoice_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("material_invoices.id"), nullable=False
    )
    line_number: Mapped[int | None] = mapped_column(Integer)
    product_name: Mapped[str | None] = mapped_column(String(500))
    gtin: Mapped[str | None] = mapped_column(String(50))
    nobb_number: Mapped[str | None] = mapped_column(String(50))
    quantity: Mapped[float | None] = mapped_column(Numeric(12, 4))
    unit: Mapped[str | None] = mapped_column(String(50))
    price_per_unit: Mapped[float | None] = mapped_column(Numeric(12, 2))
    total_price: Mapped[float | None] = mapped_column(Numeric(12, 2))
    gwp_per_unit: Mapped[float | None] = mapped_column(Numeric(12, 6))
    total_co2_kg: Mapped[float | None] = mapped_column(Numeric(12, 4))
    recycled_content_percent: Mapped[float | None] = mapped_column(Numeric(5, 2))
    confidence_score: Mapped[int | None] = mapped_column(Integer)
    flagged: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    manual_override: Mapped[bool] = mapped_column(
        Boolean, default=False, nullable=False
    )
    notes: Mapped[str | None] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=func.now(), nullable=False
    )

    material_invoice: Mapped["MaterialInvoice"] = relationship(
        back_populates="materials"
    )
