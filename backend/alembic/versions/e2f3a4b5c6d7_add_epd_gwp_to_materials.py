"""add epd_gwp to materials

Revision ID: e2f3a4b5c6d7
Revises: a1b2c3d4e5f6
Create Date: 2026-04-15 18:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "e2f3a4b5c6d7"
down_revision: Union[str, Sequence[str], None] = "a1b2c3d4e5f6"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "materials",
        sa.Column("epd_gwp", sa.JSON(), nullable=True),
    )


def downgrade() -> None:
    op.drop_column("materials", "epd_gwp")
