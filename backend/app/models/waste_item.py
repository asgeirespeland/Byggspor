from __future__ import annotations

from sqlalchemy import ForeignKey, Integer, Numeric, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class WasteItem(Base):
    __tablename__ = "waste_items"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    waste_invoice_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("waste_invoices.id"), nullable=False
    )
    line_number: Mapped[int | None] = mapped_column(Integer)
    quantity: Mapped[float | None] = mapped_column(Numeric(12, 4))
    unit: Mapped[str | None] = mapped_column(String(50))
    price_per_unit: Mapped[float | None] = mapped_column(Numeric(12, 2))
    total_price: Mapped[float | None] = mapped_column(Numeric(12, 2))
    gtin: Mapped[str | None] = mapped_column(String(50))
    nobb_number: Mapped[str | None] = mapped_column(String(50))

    waste_invoice: Mapped["WasteInvoice"] = relationship(back_populates="waste_items")
