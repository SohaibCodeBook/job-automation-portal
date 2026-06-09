"""job_listing_applied for per-user applied job tracking.

Revision ID: 004_applied
Revises: 003_favorites
Create Date: 2026-06-05

"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "004_applied"
down_revision: Union[str, Sequence[str], None] = "003_favorites"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute('CREATE EXTENSION IF NOT EXISTS "pgcrypto"')
    op.create_table(
        "job_listing_applied",
        sa.Column(
            "id",
            postgresql.UUID(as_uuid=True),
            server_default=sa.text("gen_random_uuid()"),
            nullable=False,
        ),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("job_listing_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column(
            "applied_at",
            sa.DateTime(timezone=False),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(
            ["job_listing_id"],
            ["job_listings.id"],
            name="fk_job_listing_applied_listing",
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint(
            "user_id",
            "job_listing_id",
            name="uq_job_listing_applied_user_listing",
        ),
    )
    op.create_index(
        "ix_job_listing_applied_user_id",
        "job_listing_applied",
        ["user_id"],
    )
    op.create_index(
        "ix_job_listing_applied_user_applied_at",
        "job_listing_applied",
        ["user_id", "applied_at"],
    )


def downgrade() -> None:
    op.drop_index(
        "ix_job_listing_applied_user_applied_at",
        table_name="job_listing_applied",
    )
    op.drop_index("ix_job_listing_applied_user_id", table_name="job_listing_applied")
    op.drop_table("job_listing_applied")
