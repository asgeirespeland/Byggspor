from __future__ import annotations

import enum
from datetime import datetime

from sqlalchemy import DateTime, Enum, ForeignKey, Integer, Numeric, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class InvoiceFormatType(enum.Enum):
    AGGREGATED = "aggregated"
    DETAILED = "detailed"


class GeneratedInvoice(Base):
    __tablename__ = "generated_invoices"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    project_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("projects.id"), nullable=False
    )
    format_type: Mapped[InvoiceFormatType] = mapped_column(
        Enum(InvoiceFormatType), nullable=False
    )
    total_amount_kr: Mapped[float | None] = mapped_column(Numeric(12, 2))
    total_materials_co2_kg: Mapped[float | None] = mapped_column(Numeric(12, 4))
    total_transport_co2_kg: Mapped[float | None] = mapped_column(Numeric(12, 4))
    total_waste_co2_kg: Mapped[float | None] = mapped_column(Numeric(12, 4))
    total_energy_co2_kg: Mapped[float | None] = mapped_column(Numeric(12, 4))
    total_co2_kg: Mapped[float | None] = mapped_column(Numeric(12, 4))
    overall_confidence_score: Mapped[int | None] = mapped_column(Integer)
    recycled_content_percent: Mapped[float | None] = mapped_column(Numeric(5, 2))
    ehf_xml_path: Mapped[str | None] = mapped_column(String(500))
    pdf_report_path: Mapped[str | None] = mapped_column(String(500))
    generated_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=func.now(), nullable=False
    )
    sent_at: Mapped[datetime | None] = mapped_column(DateTime)

    project: Mapped["Project"] = relationship(back_populates="generated_invoices")
