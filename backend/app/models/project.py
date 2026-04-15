from __future__ import annotations

import enum
from datetime import datetime

from sqlalchemy import JSON, DateTime, Enum, ForeignKey, Integer, String, event, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class ProjectStatus(enum.Enum):
    ACTIVE = "active"
    COMPLETED = "completed"
    ARCHIVED = "archived"


class Project(Base):
    __tablename__ = "projects"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    organization_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("organizations.id"), nullable=False
    )
    created_by_user_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("users.id"), nullable=False
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    customer_id: Mapped[int | None] = mapped_column(
        Integer, ForeignKey("organizations.id")
    )
    project_number: Mapped[str | None] = mapped_column(String(100))
    status: Mapped[ProjectStatus] = mapped_column(
        Enum(ProjectStatus), default=ProjectStatus.ACTIVE, nullable=False
    )
    settings: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=func.now(), onupdate=func.now(), nullable=False
    )
    completed_at: Mapped[datetime | None] = mapped_column(DateTime)

    organization: Mapped["Organization"] = relationship(
        back_populates="projects",
        foreign_keys=[organization_id],
    )
    created_by_user: Mapped["User"] = relationship(back_populates="projects")
    customer: Mapped["Organization | None"] = relationship(
        foreign_keys=[customer_id],
    )
    project_materials: Mapped[list["ProjectMaterial"]] = relationship(
        back_populates="project"
    )
    transports: Mapped[list["Transport"]] = relationship(back_populates="project")
    project_transports: Mapped[list["ProjectTransport"]] = relationship(
        back_populates="project"
    )
    project_waste_items: Mapped[list["ProjectWasteItem"]] = relationship(
        back_populates="project"
    )
    energies: Mapped[list["Energy"]] = relationship(back_populates="project")
    generated_invoices: Mapped[list["GeneratedInvoice"]] = relationship(
        back_populates="project"
    )
    project_memberships: Mapped[list["ProjectMember"]] = relationship(
        back_populates="project",
        cascade="all, delete-orphan",
    )

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "name": self.name,
            "project_number": self.project_number,
            "status": self.status.value,
            "organization_id": self.organization_id,
            "created_by_user_id": self.created_by_user_id,
            "customer_id": self.customer_id,
            "customer_name": self.customer.name if self.customer else None,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
            "completed_at": (
                self.completed_at.isoformat() if self.completed_at else None
            ),
        }


@event.listens_for(Project, "after_insert")
def _add_creator_to_project_members(mapper, connection, target: Project):
    from app.models.project_member import ProjectMember, ProjectRole

    connection.execute(
        ProjectMember.__table__.insert().values(
            user_id=target.created_by_user_id,
            project_id=target.id,
            role=ProjectRole.OWNER.name,
        )
    )
