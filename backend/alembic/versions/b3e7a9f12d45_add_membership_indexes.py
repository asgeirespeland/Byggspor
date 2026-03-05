"""add membership indexes

Revision ID: b3e7a9f12d45
Revises: 9a4f2d1c0b7e
Create Date: 2026-03-05 10:00:00.000000

"""

from typing import Sequence, Union

from alembic import op


# revision identifiers, used by Alembic.
revision: str = "b3e7a9f12d45"
down_revision: Union[str, Sequence[str], None] = "9a4f2d1c0b7e"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_index(
        "ix_organization_members_organization_id",
        "organization_members",
        ["organization_id"],
    )
    op.create_index(
        "ix_project_members_project_id",
        "project_members",
        ["project_id"],
    )


def downgrade() -> None:
    op.drop_index("ix_project_members_project_id", table_name="project_members")
    op.drop_index(
        "ix_organization_members_organization_id",
        table_name="organization_members",
    )
