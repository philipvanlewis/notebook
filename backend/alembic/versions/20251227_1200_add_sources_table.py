"""Add sources table

Revision ID: a1b2c3d4e5f6
Revises: f87cd8d27053
Create Date: 2025-12-27 12:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql
import pgvector.sqlalchemy.vector

# revision identifiers, used by Alembic.
revision: str = 'a1b2c3d4e5f6'
down_revision: Union[str, None] = 'f87cd8d27053'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table('sources',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('owner_id', sa.UUID(), nullable=False),
        sa.Column('source_type', sa.String(length=20), nullable=False),
        sa.Column('url', sa.String(length=2000), nullable=True),
        sa.Column('filename', sa.String(length=500), nullable=True),
        sa.Column('title', sa.String(length=500), nullable=False),
        sa.Column('content', sa.Text(), nullable=False),
        sa.Column('page_count', sa.Integer(), nullable=True),
        sa.Column('word_count', sa.Integer(), nullable=True),
        sa.Column('extra_data', postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column('status', sa.String(length=20), nullable=False),
        sa.Column('error', sa.Text(), nullable=True),
        sa.Column('embedding', pgvector.sqlalchemy.vector.VECTOR(dim=1536), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['owner_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_sources_owner_id'), 'sources', ['owner_id'], unique=False)
    op.create_index('ix_sources_owner_id_created_at', 'sources', ['owner_id', 'created_at'], unique=False)
    op.create_index('ix_sources_owner_id_status', 'sources', ['owner_id', 'status'], unique=False)


def downgrade() -> None:
    op.drop_index('ix_sources_owner_id_status', table_name='sources')
    op.drop_index('ix_sources_owner_id_created_at', table_name='sources')
    op.drop_index(op.f('ix_sources_owner_id'), table_name='sources')
    op.drop_table('sources')
