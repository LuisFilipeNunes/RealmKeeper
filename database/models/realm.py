from database.db_manager import db
import uuid

class Realm(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    uid = db.Column(db.String(36), unique=True, nullable=False)
    description = db.Column(db.Text, nullable=False)
    nodes = db.Column(db.JSON, nullable=False)
    permissions = db.Column(db.JSON, nullable=False)

    def __init__(self, name, description, owner_uuid):
        self.name = name
        self.uid = str(uuid.uuid4())
        self.description = description
        self.nodes = []
        self.permissions = {
            'owner': [owner_uuid],
            'editor': [],
            'viewer': []
        }
