"""job_listings table already exists in Postgres.

Existing databases: no-op (run ``alembic upgrade head`` to record revision only).
Fresh databases: create job_listings via your scraper/DB setup or add CREATE in a new revision.

Revision ID: 002_job_listings
Revises: 001_baseline
Create Date: 2026-05-19

"""

from typing import Sequence, Union

revision: str = "002_job_listings"
down_revision: Union[str, Sequence[str], None] = "001_baseline"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass
