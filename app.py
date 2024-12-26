from flask import Flask
from database.db_manager import db, init_db
from routes.landing import landing_bp
from routes.login import login_bp
from routes.register import register_bp
import os

basedir = os.path.abspath(os.path.dirname(__file__))
database_path = os.path.join(basedir, 'database', 'users.db')
database_dir = os.path.dirname(database_path)

if not os.path.exists(database_dir):
    os.makedirs(database_dir)

app = Flask(__name__)
app.config['SECRET_KEY'] = 'your-super-secret-key'
app.config['SQLALCHEMY_DATABASE_URI'] = f'sqlite:///{database_path}'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

init_db(app)

with app.app_context():
    db.create_all()

app.register_blueprint(landing_bp)
app.register_blueprint(login_bp)
app.register_blueprint(register_bp)
if __name__ == '__main__':
    app.run(host='0.0.0.0', port=10450, debug=True)
    