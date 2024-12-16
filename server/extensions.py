from flask_bcrypt import Bcrypt
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from flask_cors import CORS

bcrypt = Bcrypt()
db = SQLAlchemy()
migrate = Migrate()
cors = CORS()
