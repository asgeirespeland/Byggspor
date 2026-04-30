"""drop_invoice_file_path_columns

Revision ID: 631097797d64
Revises: f6c2d9a14b87
Create Date: 2026-04-29 18:06:16.418520

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '631097797d64'
down_revision: Union[str, Sequence[str], None] = 'f6c2d9a14b87'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.drop_column('generated_invoices', 'pdf_report_path')
    op.drop_column('generated_invoices', 'ehf_xml_path')


def downgrade() -> None:
    op.add_column('generated_invoices', sa.Column('ehf_xml_path', sa.VARCHAR(length=500), autoincrement=False, nullable=True))
    op.add_column('generated_invoices', sa.Column('pdf_report_path', sa.VARCHAR(length=500), autoincrement=False, nullable=True))
