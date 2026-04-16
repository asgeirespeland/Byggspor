from __future__ import annotations

from datetime import datetime

from sqlalchemy import (
    JSON,
    Boolean,
    DateTime,
    Integer,
    Numeric,
    String,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class Material(Base):
    """Shared product catalog — one record per unique product.

    Acts as NOBB lookup cache. Not owned by any project or org.
    """

    __tablename__ = "materials"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    gtin: Mapped[str | None] = mapped_column(String(50), unique=True)
    nobb_number: Mapped[str | None] = mapped_column(String(50), unique=True)
    product_name: Mapped[str | None] = mapped_column(String(500))
    product_group: Mapped[str | None] = mapped_column(String(255))
    gwp_per_unit: Mapped[float | None] = mapped_column(Numeric(12, 6))
    unit: Mapped[str | None] = mapped_column(String(50))
    recycled_content_percent: Mapped[float | None] = mapped_column(Numeric(5, 2))
    has_epd: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    epd_id: Mapped[str | None] = mapped_column(String(100))
    epd_gwp: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    cached_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=func.now(), onupdate=func.now(), nullable=False
    )

    project_materials: Mapped[list["ProjectMaterial"]] = relationship(
        back_populates="material"
    )
