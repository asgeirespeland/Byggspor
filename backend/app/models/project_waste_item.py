from __future__ import annotations

import enum
from datetime import datetime

from sqlalchemy import (
    DateTime,
    Enum,
    ForeignKey,
    Integer,
    Numeric,
    String,
    Text,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class WasteSourceType(enum.Enum):
    WASTE_REPORT = "waste_report"
    MANUAL = "manual"


class ProjectWasteItem(Base):
    """Waste data for a specific project, with source provenance."""

    __tablename__ = "project_waste_items"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    project_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("projects.id", ondelete="CASCADE"), nullable=False
    )
    source_id: Mapped[int | None] = mapped_column(
        Integer, ForeignKey("waste_invoices.id")
    )
    source_type: Mapped[WasteSourceType | None] = mapped_column(Enum(WasteSourceType))
    waste_type: Mapped[str | None] = mapped_column(String(255))
    quantity: Mapped[float | None] = mapped_column(Numeric(10, 4))
    unit: Mapped[str | None] = mapped_column(String(10))
    co2_from_report_kg: Mapped[float | None] = mapped_column(Numeric(12, 4))
    calculated_co2_kg: Mapped[float | None] = mapped_column(Numeric(12, 4))
    total_co2_kg: Mapped[float | None] = mapped_column(Numeric(12, 4))
    confidence_score: Mapped[int | None] = mapped_column(Integer)
    cost_per_ton: Mapped[float | None] = mapped_column(Numeric(10, 2))
    notes: Mapped[str | None] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=func.now(), nullable=False
    )

    project: Mapped["Project"] = relationship(back_populates="project_waste_items")
    source_invoice: Mapped["WasteInvoice | None"] = relationship()
