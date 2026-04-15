"""Add invoice_lines table and customer/metadata fields to generated_invoices

Revision ID: f1a3c8e2b045
Revises: c4a1e7f23b91
Create Date: 2026-04-15 10:00:00.000000

"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = 'f1a3c8e2b045'
down_revision: Union[str, Sequence[str], None] = 'c4a1e7f23b91'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column('generated_invoices', sa.Column('customer_name', sa.String(255), nullable=True))
    op.add_column('generated_invoices', sa.Column('customer_org_number', sa.String(20), nullable=True))
    op.add_column('generated_invoices', sa.Column('customer_address', sa.Text(), nullable=True))
    op.add_column('generated_invoices', sa.Column('customer_email', sa.String(255), nullable=True))
    op.add_column('generated_invoices', sa.Column('invoice_number', sa.String(50), nullable=True))
    op.add_column('generated_invoices', sa.Column('due_date', sa.Date(), nullable=True))
    op.add_column('generated_invoices', sa.Column('our_reference', sa.String(255), nullable=True))
    op.add_column('generated_invoices', sa.Column('their_reference', sa.String(255), nullable=True))
    op.add_column('generated_invoices', sa.Column('bank_account', sa.String(20), nullable=True))
    op.add_column('generated_invoices', sa.Column('vat_total_kr', sa.Numeric(precision=12, scale=2), nullable=True))
    op.add_column('generated_invoices', sa.Column('grand_total_kr', sa.Numeric(precision=12, scale=2), nullable=True))

    op.create_table(
        'invoice_lines',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('generated_invoice_id', sa.Integer(), nullable=False),
        sa.Column('category', sa.Enum('material', 'transport', 'waste', 'energy', name='invoicelinecategory'), nullable=False),
        sa.Column('description', sa.Text(), nullable=False),
        sa.Column('quantity', sa.Numeric(precision=12, scale=4), nullable=True),
        sa.Column('unit', sa.String(50), nullable=True),
        sa.Column('unit_price_kr', sa.Numeric(precision=12, scale=2), nullable=True),
        sa.Column('vat_rate', sa.Numeric(precision=5, scale=4), nullable=True),
        sa.Column('line_total_kr', sa.Numeric(precision=12, scale=2), nullable=True),
        sa.Column('total_co2_kg', sa.Numeric(precision=12, scale=4), nullable=True),
        sa.Column('confidence_score', sa.Integer(), nullable=True),
        sa.Column('epd_id', sa.String(255), nullable=True),
        sa.Column('source_type', sa.Enum('project_material', 'transport', 'waste_item', 'energy', 'manual', name='invoicelinesourcetype'), nullable=True),
        sa.Column('source_id', sa.Integer(), nullable=True),
        sa.ForeignKeyConstraint(['generated_invoice_id'], ['generated_invoices.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('ix_invoice_lines_generated_invoice_id', 'invoice_lines', ['generated_invoice_id'])


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_index('ix_invoice_lines_generated_invoice_id', table_name='invoice_lines')
    op.drop_table('invoice_lines')
    sa.Enum(name='invoicelinesourcetype').drop(op.get_bind(), checkfirst=True)
    sa.Enum(name='invoicelinecategory').drop(op.get_bind(), checkfirst=True)
    for col in ('grand_total_kr', 'vat_total_kr', 'bank_account', 'their_reference',
                'our_reference', 'due_date', 'invoice_number', 'customer_email',
                'customer_address', 'customer_org_number', 'customer_name'):
        op.drop_column('generated_invoices', col)
