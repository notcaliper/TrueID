import os
import sys
import json
import hashlib
import logging
import requests
from typing import Optional
from rich import print as rprint
from rich.console import Console
from rich.prompt import Prompt
from rich.table import Table
import typer
from dotenv import load_dotenv

# Load environment variables
load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), '..', 'backend', '.env'))

API_URL = os.getenv('API_URL', 'http://localhost:3000')
ADMIN_EMAIL = os.getenv('ADMIN_EMAIL', 'admin@example.com')
ADMIN_PASSWORD = os.getenv('ADMIN_PASSWORD', 'admin123')
USER_JWT_PATH = os.path.join(os.path.dirname(__file__), 'user_jwt.token')
ADMIN_JWT_PATH = os.path.join(os.path.dirname(__file__), 'admin_jwt.token')

# Logging setup
logging.basicConfig(
    filename='debug.log',
    filemode='a',
    format='%(asctime)s %(levelname)s %(message)s',
    level=logging.DEBUG
)

console = Console()
app = typer.Typer()

# --- Helper Functions ---
def save_token(token: str, is_admin: bool = False):
    path = ADMIN_JWT_PATH if is_admin else USER_JWT_PATH
    with open(path, 'w') as f:
        f.write(token)

def load_token(is_admin: bool = False) -> Optional[str]:
    path = ADMIN_JWT_PATH if is_admin else USER_JWT_PATH
    if os.path.exists(path):
        with open(path, 'r') as f:
            return f.read().strip()
    return None

def print_request_response(req, resp):
    rprint(f"[bold cyan]Request:[/bold cyan] {req.method} {req.url}")
    if req.body:
        rprint(f"[cyan]Body:[/cyan] {req.body}")
    rprint(f"[bold magenta]Response Status:[/bold magenta] {resp.status_code}")
    try:
        rprint(f"[magenta]Response JSON:[/magenta] {resp.json()}")
    except Exception:
        rprint(f"[magenta]Response Text:[/magenta] {resp.text}")
    logging.debug(f"Request: {req.method} {req.url}\nBody: {req.body}\nResponse: {resp.status_code} {resp.text}")

def hash_facemesh(facemesh: dict) -> str:
    facemesh_str = json.dumps(facemesh, sort_keys=True)
    return hashlib.sha256(facemesh_str.encode()).hexdigest()

def get_headers(is_admin=False, token=None):
    if not token:
        token = load_token(is_admin)
    if token:
        return {'Authorization': f'Bearer {token}', 'Content-Type': 'application/json'}
    return {'Content-Type': 'application/json'}

def refresh_jwt(is_admin=False):
    if is_admin:
        return False  # Admin refresh not implemented
    token = load_token(False)
    if not token:
        return False
    resp = requests.post(f"{API_URL}/api/user/refresh-token", headers=get_headers(False, token))
    if resp.status_code == 200:
        new_token = resp.json().get('token')
        if new_token:
            save_token(new_token, False)
            rprint("[green]User JWT refreshed.[/green]")
            return True
    return False

# --- CLI Commands ---
@app.command()
def register_user():
    """Register a user with facemesh data."""
    mock_facemesh = {"landmarks": [[1,2],[3,4],[5,6]], "meta": "mock"}
    facemesh_hash = hash_facemesh(mock_facemesh)
    payload = {
        "facemeshData": mock_facemesh,
        "facemeshHash": facemesh_hash,
        "email": Prompt.ask("User email"),
        "name": Prompt.ask("Full name"),
        "governmentId": Prompt.ask("Government ID (5-50 chars)")
    }
    resp = requests.post(f"{API_URL}/api/user/register", json=payload)
    print_request_response(resp.request, resp)

@app.command()
def login_user():
    """Login a user with facemesh data."""
    mock_facemesh = {"landmarks": [[1,2],[3,4],[5,6]], "meta": "mock"}
    facemesh_hash = hash_facemesh(mock_facemesh)
    payload = {
        "facemeshData": mock_facemesh,
        "facemeshHash": facemesh_hash,
        "email": Prompt.ask("User email"),
        "governmentId": Prompt.ask("Government ID (5-50 chars)")
    }
    resp = requests.post(f"{API_URL}/api/user/login", json=payload)
    print_request_response(resp.request, resp)
    if resp.status_code == 200 and 'token' in resp.json():
        save_token(resp.json()['token'], is_admin=False)
        rprint("[green]User JWT saved.[/green]")

@app.command()
def login_admin():
    """Login as admin."""
    email = Prompt.ask("Admin email", default=ADMIN_EMAIL)
    password = Prompt.ask("Admin password", default=ADMIN_PASSWORD, password=True)
    payload = {"email": email, "password": password}
    resp = requests.post(f"{API_URL}/api/admin/login", json=payload)
    print_request_response(resp.request, resp)
    if resp.status_code == 200 and 'token' in resp.json():
        save_token(resp.json()['token'], is_admin=True)
        rprint("[green]Admin JWT saved.[/green]")

@app.command()
def view_users():
    """View all users (admin)."""
    resp = requests.get(f"{API_URL}/api/admin/users", headers=get_headers(True))
    if resp.status_code == 401:
        if refresh_jwt(True):
            resp = requests.get(f"{API_URL}/api/admin/users", headers=get_headers(True))
    print_request_response(resp.request, resp)
    if resp.ok:
        users = resp.json().get('users', [])
        table = Table(title="Users")
        table.add_column("ID")
        table.add_column("Email")
        table.add_column("Name")
        for u in users:
            table.add_row(str(u.get('id')), u.get('email', ''), u.get('name', ''))
        console.print(table)

@app.command()
def view_user(user_id: str = typer.Argument(...)):
    """View a specific user (admin)."""
    resp = requests.get(f"{API_URL}/api/admin/users/{user_id}", headers=get_headers(True))
    print_request_response(resp.request, resp)

@app.command()
def verify_user(user_id: str = typer.Argument(...)):
    """Verify a user (admin)."""
    resp = requests.post(f"{API_URL}/api/admin/users/{user_id}/verify", headers=get_headers(True))
    print_request_response(resp.request, resp)

@app.command()
def update_user(user_id: str = typer.Argument(...)):
    """Update a user (admin)."""
    payload = {}
    email = Prompt.ask("New email (leave blank to skip)")
    name = Prompt.ask("New name (leave blank to skip)")
    if email:
        payload['email'] = email
    if name:
        payload['name'] = name
    resp = requests.put(f"{API_URL}/api/admin/users/{user_id}/update", headers=get_headers(True), json=payload)
    print_request_response(resp.request, resp)

@app.command()
def record_on_chain(user_id: str = typer.Argument(...)):
    """Record identity on blockchain (admin/user)."""
    payload = {"userId": user_id}
    resp = requests.post(f"{API_URL}/api/blockchain/record", headers=get_headers(True), json=payload)
    print_request_response(resp.request, resp)

@app.command()
def fetch_from_chain(user_id: str = typer.Argument(...)):
    """Fetch identity record from blockchain."""
    resp = requests.get(f"{API_URL}/api/blockchain/fetch/{user_id}", headers=get_headers(True))
    print_request_response(resp.request, resp)

@app.command()
def view_logs():
    """View audit logs (admin)."""
    resp = requests.get(f"{API_URL}/api/admin/logs", headers=get_headers(True))
    print_request_response(resp.request, resp)

if __name__ == "__main__":
    app()
