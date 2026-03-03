from __future__ import annotations

import enum
from datetime import datetime

from sqlalchemy import (
    Boolean,
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


class MaterialSourceType(enum.Enum):
    EHF_INVOICE = "ehf_invoice"
    MANUAL = "manual"
    CSV_IMPORT = "csv_import"


class ProjectMaterial(Base):
    """A material used in a specific project, with source provenance."""

    __tablename__ = "project_materials"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    project_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("projects.id"), nullable=False
    )
    material_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("materials.id"), nullable=False
    )
    source_id: Mapped[int | None] = mapped_column(
        Integer, ForeignKey("material_invoices.id")
    )
    source_type: Mapped[MaterialSourceType | None] = mapped_column(
        Enum(MaterialSourceType)
    )
    line_number: Mapped[int | None] = mapped_column(Integer)
    quantity: Mapped[float | None] = mapped_column(Numeric(12, 4))
    unit: Mapped[str | None] = mapped_column(String(50))
    price_per_unit: Mapped[float | None] = mapped_column(Numeric(12, 2))
    total_price: Mapped[float | None] = mapped_column(Numeric(12, 2))
    total_co2_kg: Mapped[float | None] = mapped_column(Numeric(12, 4))
    confidence_score: Mapped[int | None] = mapped_column(Integer)
    flagged: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    manual_override: Mapped[bool] = mapped_column(
        Boolean, default=False, nullable=False
    )
    notes: Mapped[str | None] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=func.now(), nullable=False
    )

    project: Mapped["Project"] = relationship(back_populates="project_materials")
    material: Mapped["Material"] = relationship(back_populates="project_materials")
    source_invoice: Mapped["MaterialInvoice | None"] = relationship()
