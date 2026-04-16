from __future__ import annotations

from datetime import datetime

from sqlalchemy import DateTime, Integer, String, func
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class WasteInvoice(Base):
    """Source metadata for an uploaded waste report.

    No project FK — linked to projects only through project_waste_items.source_id.
    """

    __tablename__ = "waste_invoices"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    supplier_name: Mapped[str | None] = mapped_column(String(255))
    file_path: Mapped[str | None] = mapped_column(String(500))
    uploaded_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=func.now(), nullable=False
    )
    processed_at: Mapped[datetime | None] = mapped_column(DateTime)
