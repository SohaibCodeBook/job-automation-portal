"""job_listing_notes for per-user job notes.

Revision ID: 005_notes
Revises: 004_applied
Create Date: 2026-06-29

"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "005_notes"
down_revision: Union[str, Sequence[str], None] = "004_applied"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    if "job_listing_notes" in inspector.get_table_names():
        return

    op.execute('CREATE EXTENSION IF NOT EXISTS "pgcrypto"')
    op.create_table(
        "job_listing_notes",
        sa.Column(
            "id",
            postgresql.UUID(as_uuid=True),
            server_default=sa.text("gen_random_uuid()"),
            nullable=False,
        ),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("job_listing_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("note", sa.Text(), server_default="", nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=False),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=False),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(
            ["job_listing_id"],
            ["job_listings.id"],
            name="fk_job_listing_notes_listing",
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint(
            "user_id",
            "job_listing_id",
            name="uq_job_listing_notes_user_listing",
        ),
    )
    op.create_index(
        "ix_job_listing_notes_user_id",
        "job_listing_notes",
        ["user_id"],
    )
    op.create_index(
        "ix_job_listing_notes_job_listing_id",
        "job_listing_notes",
        ["job_listing_id"],
    )


def downgrade() -> None:
    op.drop_index(
        "ix_job_listing_notes_job_listing_id",
        table_name="job_listing_notes",
    )
    op.drop_index("ix_job_listing_notes_user_id", table_name="job_listing_notes")
    op.drop_table("job_listing_notes")
