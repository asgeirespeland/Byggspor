"""add period_start to energies

Revision ID: a2b3c4d5e6f7
Revises: f5b8d2e7a319
Create Date: 2026-04-27

"""

from alembic import op
import sqlalchemy as sa

revision = "a2b3c4d5e6f7"
down_revision = "f5b8d2e7a319"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("energies", sa.Column("period_start", sa.Date(), nullable=True))


def downgrade() -> None:
    op.drop_column("energies", "period_start")
