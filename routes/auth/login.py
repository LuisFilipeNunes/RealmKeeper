from flask import Blueprint, render_template, request, flash, redirect, url_for, session
from datetime import timedelta, datetime
from database.models.user import User
from database.db_manager import db
from functools import wraps

login_bp = Blueprint('login', __name__)

def check_session_expired(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'user_id' not in session:
            return redirect(url_for('login.login'))
        return f(*args, **kwargs)
    return decorated_function

@login_bp.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        username = request.form.get('username')
        password = request.form.get('password')
        
        user = User.query.filter_by(username=username).first()
        
        if user and user.check_password(password):
            session.permanent = True
            session.permanent_session_lifetime = timedelta(minutes=1)  # 1 minute for testing
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
