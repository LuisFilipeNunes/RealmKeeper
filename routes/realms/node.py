from flask import Blueprint, render_template, request, jsonify, flash, redirect, url_for, current_app
from routes.auth.login import check_session_expired

from database.models.node import Node
from database.db_manager import db

node_bp = Blueprint('node', __name__)

@node_bp.route('/node/<realm_id>n<node_id>')
@check_session_expired
def view_node(node_id, realm_id):
    current_app.logger.info(f"Node ID: {node_id}")
    node = Node.query.filter_by(uuid=node_id).first_or_404()
    return render_template('node/view_node.html', node=node, realm_id=realm_id)

@node_bp.route('/node/update', methods=['POST'])
@check_session_expired
def update_node():
    data = request.get_json()
    node = Node.query.filter_by(uuid=data['node_id']).first()
    
    if node:
        node.name = data['name']
        node.description = data['description']
        db.session.commit()
        return jsonify({'status': 'success'})
    
    return jsonify({'status': 'error'}), 404