import os
import sys

# Add backend dir to path so imports work when run from any directory
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from flask import Flask, send_from_directory
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from config import Config
from models import db
from auth import auth_bp
from api import api_bp


def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)

    # Extensions
    db.init_app(app)
    CORS(app, origins=Config.CORS_ORIGINS, supports_credentials=True)
    JWTManager(app)

    limiter = Limiter(
        key_func=get_remote_address,
        app=app,
        default_limits=[],
        storage_uri="memory://",
    )
    # Rate limit auth endpoints
    limiter.limit("5/minute")(auth_bp)

    # Register blueprints
    app.register_blueprint(auth_bp)
    app.register_blueprint(api_bp)

    # Create tables if they don't exist
    with app.app_context():
        db.create_all()

    # Serve frontend in production
    frontend_dist = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "frontend", "dist")
    if os.path.isdir(frontend_dist):

        @app.route("/", defaults={"path": ""})
        @app.route("/<path:path>")
        def serve_frontend(path):
            full = os.path.join(frontend_dist, path)
            if path and os.path.isfile(full):
                return send_from_directory(frontend_dist, path)
            return send_from_directory(frontend_dist, "index.html")

    return app


if __name__ == "__main__":
    app = create_app()
    port = int(os.environ.get("PORT", 3001))
    app.run(host="0.0.0.0", port=port, debug=True)
