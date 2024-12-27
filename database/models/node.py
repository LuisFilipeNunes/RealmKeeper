from database.db_manager import db
import uuid
from sqlalchemy.dialects.postgresql import JSON


class Node(db.Model):
    __tablename__ = 'nodes'
    
    id = db.Column(db.Integer, primary_key=True)
    uuid = db.Column(db.String(36), unique=True, nullable=False)
    name = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text, nullable=False)
    type = db.Column(db.String(20), nullable=False)
    links = db.Column(db.JSON, nullable=False)
    permissions = db.Column(db.JSON, nullable=False)
    realms_listed = db.Column(db.JSON, nullable=False)
    
    # Type-specific columns
    major = db.Column(db.Boolean, default=False)  # For Lore
    current = db.Column(db.String(36))  # For Item
    is_player = db.Column(db.Boolean, default=False)  # For Person
    player_uuid = db.Column(db.String(36))  # For Person
    
    def __init__(self, name, description, node_type, owner_uuid, realms_listed=None):
        self.uuid = str(uuid.uuid4())
        self.name = name
        self.description = description
        self.type = node_type
        self.links = []
        self.realms_listed = realms_listed if realms_listed else []
        self.permissions = {
            'owner': [owner_uuid],
            'editor': [],
            'viewer': []
        }