from flask import Blueprint, render_template, request, flash, redirect, url_for, session, jsonify
from routes.auth.login import check_session_expired
from database.models.realm import Realm
from database.models.node import Node
from database.models.user import User
from database.db_manager import db
from utils.user_helpers import get_user_by_id
from sqlalchemy.orm.attributes import flag_modified

realms_bp = Blueprint('realms', __name__)

@realms_bp.route('/realms', methods=['GET', 'POST'])
@check_session_expired
def realms():
    user_id = session.get('user_id')
    user_realms = Realm.query.filter(
        Realm.permissions['owner'].contains([user_id]) |
        Realm.permissions['editor'].contains([user_id]) |
        Realm.permissions['viewer'].contains([user_id])
    ).all()
    
    return render_template('realms/realms.html', realms=user_realms)

@realms_bp.route('/realms/<identifier>')
@check_session_expired
def view_realm(identifier):
    # Try to find realm by uid first
    realm = Realm.query.filter_by(uid=identifier).first()
    
    # If not found by uid, try by name
    if not realm:
        realm = Realm.query.filter_by(name=identifier).first()
    
    if not realm:
        flash('Realm not found', 'error')
        return redirect(url_for('realms.realms'))
    
    # Fetch the actual Node objects using the stored UUIDs
    nodes = Node.query.filter(Node.realms_listed.contains([realm.uid])).all()
    print(nodes)
    return render_template('realms/view_realm.html', realm=realm, nodes=nodes,get_user_by_id=get_user_by_id)

@realms_bp.route('/realms/create', methods=['POST'])
@check_session_expired
def create_realm():
    if request.method == 'POST':
        name = request.form.get('name')
        description = request.form.get('description')
        user_id = session.get('user_id')
        
        new_realm = Realm(name=name, description=description, owner_uuid=user_id)
        db.session.add(new_realm)
        db.session.commit()
        
        flash('Realm created successfully!', 'success')
        return redirect(url_for('realms.realms'))


@realms_bp.route('/realms/<realm_id>/nodes/create', methods=['POST'])
@check_session_expired
def create_node(realm_id):
    realm = Realm.query.filter_by(uid=realm_id).first()
    if not realm:
        flash('Realm not found', 'error')
        return redirect(url_for('realms.realms'))
        
    name = request.form.get('name')
    description = request.form.get('description')
    node_type = request.form.get('type')
    user_id = session.get('user_id')
    
    new_node = Node(
        name=name, 
        description=description, 
        node_type=node_type, 
        owner_uuid=user_id,
        realms_listed=[realm_id]  # Add the realm_id to realms_listed
    )
    
    # Handle type-specific fields
    if node_type == 'lore':
        new_node.major = bool(request.form.get('major'))
    elif node_type == 'item':
        new_node.current = request.form.get('current')
    elif node_type == 'person':
        new_node.is_player = bool(request.form.get('is_player'))
        if new_node.is_player:
            new_node.player_uuid = request.form.get('player_uuid')
    
    db.session.add(new_node)
    db.session.commit()
    
    flash('Content created successfully!', 'success')
    return redirect(url_for('realms.view_realm', identifier=realm_id))

@realms_bp.route('/realms/<realm_id>/update', methods=['POST'])
def update_realm(realm_id):
    print(realm_id)
    realm = get_realm_or_404(realm_id)
    current_user_id = session.get('user_id')
    data = request.get_json()
    description = data.get('description')
    permission_error = check_permission(realm, current_user_id, role='owner')
    if permission_error:
        return permission_error
    realm.description = description

    flag_modified(realm, "description")
    db.session.add(realm)
    db.session.commit()
    return jsonify({'message': 'Realm updated successfully'}), 200

@realms_bp.route('/realms/<realm_id>/permissions', methods=['GET', 'POST', 'DELETE'])
@check_session_expired
def manage_realm_permission(realm_id):
    current_user_id = session.get('user_id')
    realm = get_realm_or_404(realm_id)
    if isinstance(realm, tuple):  # Error response
        return realm

    if request.method == 'GET':
        editors = User.query.filter(User.id.in_(realm.permissions['editor'])).all()
        viewers = User.query.filter(User.id.in_(realm.permissions['viewer'])).all()
        return jsonify({
            'editors': [{'username': editor.username, 'id': editor.id} for editor in editors],
            'viewers': [{'username': viewer.username, 'id': viewer.id} for viewer in viewers]
        })

    data = request.get_json()
    username = data.get('username')
    permission_level = data.get('permission_level') if request.method == 'POST' else data.get('role')

    if not username or not permission_level:
        return jsonify({'message': 'Invalid request data'}), 400

    permission_error = check_permission(realm, current_user_id, role='owner')
    if permission_error:
        return permission_error

    user = get_user_or_404(username)
    if isinstance(user, tuple):  # Error response
        return user

    user_list_key = 'editor' if permission_level == 'admin' else 'viewer'

    if request.method == 'POST':
        if user.id in realm.permissions[user_list_key]:
            return jsonify({'message': 'User already at this level'}), 400
        realm.permissions[user_list_key].append(user.id)

    elif request.method == 'DELETE':
        if user.id not in realm.permissions[user_list_key]:
            return jsonify({'message': 'User does not have this level'}), 400
        realm.permissions[user_list_key].remove(user.id)

    flag_modified(realm, "permissions")
    db.session.add(realm)
    db.session.commit()
    action = 'added' if request.method == 'POST' else 'removed'
    return jsonify({'message': f'Permission {action} successfully'}), 200

def get_realm_or_404(realm_id):
    """Retrieve realm by ID or return a 404 error."""
    realm = Realm.query.filter_by(uid=realm_id).first()
    if not realm:
        return jsonify({'message': 'Realm not found'}), 404
    return realm

def get_user_or_404(username):
    """Retrieve user by username or return a 404 error."""
    user = User.query.filter_by(username=username).first()
    if not user:
        return jsonify({'message': 'User not found'}), 404
    return user

def check_permission(realm, current_user_id, role='owner'):
    """Check if the current user has the required permissions."""
    if current_user_id not in realm.permissions.get(role, []):
        return jsonify({'message': 'You do not have permission'}), 403
    return None