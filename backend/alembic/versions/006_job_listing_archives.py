"""job_listing_archives for per-user archived listings.

Revision ID: 006_archives
Revises: 005_notes
Create Date: 2026-07-16

NOTE: If you already created this table manually in Postgres, run:
  INSERT INTO alembic_version (version_num) VALUES ('006_archives')
  -- or alembic stamp 006_archives
so migrations stay in sync.
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "006_archives"
down_revision: Union[str, Sequence[str], None] = "005_notes"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute('CREATE EXTENSION IF NOT EXISTS "pgcrypto"')
    op.create_table(
        "job_listing_archives",
        sa.Column(
            "id",
            postgresql.UUID(as_uuid=True),
            server_default=sa.text("gen_random_uuid()"),
            nullable=False,
        ),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("job_listing_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=False),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(
            ["job_listing_id"],
            ["job_listings.id"],
            name="fk_job_listing_archives_listing",
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint(
            "user_id",
            "job_listing_id",
            name="uq_job_listing_archives_user_listing",
        ),
    )
    op.create_index(
        "ix_job_listing_archives_user_id",
        "job_listing_archives",
        ["user_id"],
    )


def downgrade() -> None:
    op.drop_index("ix_job_listing_archives_user_id", table_name="job_listing_archives")
    op.drop_table("job_listing_archives")
