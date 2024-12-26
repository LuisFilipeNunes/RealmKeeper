from flask import Blueprint, render_template, session

landing_bp = Blueprint('landing', __name__)

@landing_bp.route('/')
def landing():
    if 'user_id' in session:
        return render_template('auth_menu/landing_logged.html', username=session['username'])
    return render_template('auth_menu/landing.html')