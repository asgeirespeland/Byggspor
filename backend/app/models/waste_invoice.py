from __future__ import annotations

import enum
from datetime import datetime

from sqlalchemy import DateTime, Enum, ForeignKey, Integer, Numeric, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class WasteSource(enum.Enum):
    FILE = "file"
    MANUAL = "manual"


class WasteInvoice(Base):
    __tablename__ = "waste_invoices"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    project_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("projects.id"), nullable=False
    )
    source: Mapped[WasteSource | None] = mapped_column(Enum(WasteSource))
    waste_type: Mapped[str | None] = mapped_column(String(255))
    quantity_tons: Mapped[float | None] = mapped_column(Numeric(10, 4))
    co2_from_report_kg: Mapped[float | None] = mapped_column(Numeric(12, 4))
    calculated_co2_kg: Mapped[float | None] = mapped_column(Numeric(12, 4))
    total_co2_kg: Mapped[float | None] = mapped_column(Numeric(12, 4))
    confidence_score: Mapped[int | None] = mapped_column(Integer)
    file_path: Mapped[str | None] = mapped_column(String(500))
    notes: Mapped[str | None] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=func.now(), nullable=False
    )

    project: Mapped["Project"] = relationship(back_populates="waste_invoices")
    waste_items: Mapped[list["WasteItem"]] = relationship(
        back_populates="waste_invoice"
    )
