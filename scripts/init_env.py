"""Create backend/.env with a random SECRET_KEY (only if it does not exist yet)."""
import secrets
from pathlib import Path

root = Path(__file__).resolve().parents[1] / "backend"
env, example = root / ".env", root / ".env.example"
if env.exists():
    print("backend/.env already exists - keeping it.")
else:
    text = example.read_text().replace("SECRET_KEY=change-me", "SECRET_KEY=" + secrets.token_hex(32))
    env.write_text(text)
    print("Created backend/.env with a new random SECRET_KEY.")
