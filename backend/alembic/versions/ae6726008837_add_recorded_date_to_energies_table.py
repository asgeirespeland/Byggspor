"""add recorded_date to energies table

Revision ID: ae6726008837
Revises: 7ba74d3aa9b9
Create Date: 2026-03-23 15:48:11.238199

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'ae6726008837'
down_revision: Union[str, Sequence[str], None] = '7ba74d3aa9b9'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column('energies', sa.Column('recorded_date', sa.Date(), nullable=True))


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_column('energies', 'recorded_date')
