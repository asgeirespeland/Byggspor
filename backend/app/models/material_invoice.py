from __future__ import annotations

from datetime import date, datetime

from sqlalchemy import Date, DateTime, Integer, Numeric, String, func
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class MaterialInvoice(Base):
    """Source metadata for an uploaded EHF invoice.

    No project FK — linked to projects only through project_materials.source_id.
    """

    __tablename__ = "material_invoices"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    supplier_name: Mapped[str | None] = mapped_column(String(255))
    invoice_number: Mapped[str | None] = mapped_column(String(100))
    invoice_date: Mapped[date | None] = mapped_column(Date)
    total_amount_kr: Mapped[float | None] = mapped_column(Numeric(12, 2))
    file_path: Mapped[str | None] = mapped_column(String(500))
    uploaded_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=func.now(), nullable=False
    )
    processed_at: Mapped[datetime | None] = mapped_column(DateTime)
