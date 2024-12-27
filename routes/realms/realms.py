from flask import Blueprint, render_template, request, flash, redirect, url_for, session
from routes.auth.login import check_session_expired
from database.models.realm import Realm
from database.models.node import Node
from database.db_manager import db

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
    return render_template('realms/view_realm.html', realm=realm, nodes=nodes)

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
