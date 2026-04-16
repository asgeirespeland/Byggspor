"""add settings to organizations and projects

Revision ID: a1b2c3d4e5f6
Revises: c4a1e7f23b91
Create Date: 2026-04-15 16:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "a1b2c3d4e5f6"
down_revision: Union[str, Sequence[str], None] = "f1a3c8e2b045"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "organizations",
        sa.Column("settings", sa.JSON(), nullable=True),
    )
    op.add_column(
        "projects",
        sa.Column("settings", sa.JSON(), nullable=True),
    )


def downgrade() -> None:
    op.drop_column("projects", "settings")
    op.drop_column("organizations", "settings")
