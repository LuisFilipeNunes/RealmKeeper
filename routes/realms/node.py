from flask import Blueprint, render_template, request, jsonify
from routes.auth.login import check_session_expired

from database.models.node import Node
from database.db_manager import db

from utils.user_helpers import get_user_by_id

node_bp = Blueprint('node', __name__)

@node_bp.route('/node/<realm_id>n<node_id>')
@check_session_expired
def view_node(node_id, realm_id):
    node = Node.query.filter_by(uuid=node_id).first_or_404()
    return render_template('node/view_node.html', node=node, realm_id=realm_id, get_user_by_id=get_user_by_id)

@node_bp.route('/node/update', methods=['POST'])
@check_session_expired
def update_node():
    data = request.get_json()
    node = Node.query.filter_by(uuid=data['node_id']).first()
    for i in node:
        print(node.i)
    if node:
        node.name = data['name']
        node.description = data['description']
        db.session.commit()
        return jsonify({'status': 'success'})
    
    return jsonify({'status': 'error'}), 404


@node_bp.route('/node/permissions/add', methods=['POST'])
@check_session_expired
def add_permission():
    data = request.get_json()
    node = Node.query.filter_by(uuid=data['node_id']).first()
    if node:
        role = data['role']
        if role in node.permissions:
            print(role)
            node.permissions[role].append(data['username'])
            db.session.commit()
            return jsonify({'status': 'success'})
    return jsonify({'status': 'error'}), 404

@node_bp.route('/node/permissions/remove', methods=['POST'])
@check_session_expired
def remove_permission():
    data = request.get_json()
    node = Node.query.filter_by(uuid=data['node_id']).first()
    if node:
        role = data['role']
        if role in node.permissions and data['username'] in node.permissions[role]:
            node.permissions[role].remove(data['username'])
            db.session.commit()
            return jsonify({'status': 'success'})
    return jsonify({'status': 'error'}), 404
