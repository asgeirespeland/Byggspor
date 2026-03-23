"""add price_zone to energies table

Revision ID: 7ba74d3aa9b9
Revises: 955fe78e7586
Create Date: 2026-03-23 15:41:21.277409

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '7ba74d3aa9b9'
down_revision: Union[str, Sequence[str], None] = '955fe78e7586'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pricezone = sa.Enum('NO1', 'NO2', 'NO3', 'NO4', 'NO5', name='pricezone')
    pricezone.create(op.get_bind(), checkfirst=True)
    op.add_column('energies', sa.Column('price_zone', pricezone, nullable=True))


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_column('energies', 'price_zone')
    sa.Enum(name='pricezone').drop(op.get_bind(), checkfirst=True)
