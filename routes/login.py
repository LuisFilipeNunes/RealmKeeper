from flask import Blueprint, render_template, request, flash, redirect, url_for, session
from database.models.user import User
from database.db_manager import db

login_bp = Blueprint('login', __name__)

@login_bp.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        username = request.form.get('username')
        password = request.form.get('password')
        
        user = User.query.filter_by(username=username).first()
        
        if user and user.check_password(password):
            session['user_id'] = user.id
            session['username'] = user.username
            session['first_login'] = user.last_login is None
            
            user.update_login_timestamp()
            db.session.commit()
            
            return redirect(url_for('landing.landing'))
        else:
            flash('Invalid username or password', 'error')
            
    return render_template('auth_menu/login.html')

@login_bp.route('/logout')
def logout():
    session.clear()
    return redirect(url_for('landing.landing'))