"""empty message

Revision ID: 0dc0fca3226f
Revises: a809e2596dd7
Create Date: 2025-03-11 11:34:54.761753

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '0dc0fca3226f'
down_revision = 'a809e2596dd7'
branch_labels = None
depends_on = None


def upgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    with op.batch_alter_table('users_table', schema=None) as batch_op:
        batch_op.add_column(sa.Column('question1_answer', sa.String(length=300), nullable=True))
        batch_op.add_column(sa.Column('question2_answer', sa.String(length=300), nullable=True))
        batch_op.add_column(sa.Column('question3_answer', sa.String(length=300), nullable=True))

    # ### end Alembic commands ###


def downgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    with op.batch_alter_table('users_table', schema=None) as batch_op:
        batch_op.drop_column('question3_answer')
        batch_op.drop_column('question2_answer')
        batch_op.drop_column('question1_answer')

    # ### end Alembic commands ###
