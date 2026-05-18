"""Baseline: auth.users and public.job_applications already exist.

Existing databases: run ``alembic stamp head`` (does not create tables).
Fresh databases: add a new revision with CREATE statements, or restore from backup.

Revision ID: 001_baseline
Revises:
Create Date: 2026-05-18

"""

from typing import Sequence, Union

# revision identifiers, used by Alembic.
revision: str = "001_baseline"
down_revision: Union[str, Sequence[str], None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass
