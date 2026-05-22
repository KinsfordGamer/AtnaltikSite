#!/usr/bin/env bash
set -e
REMOTE_DIR="/home/ubuntu/atnaltik_deploy"
TAR_PATH="/home/ubuntu/atnaltik.tar.gz"

mkdir -p "$REMOTE_DIR"
cd "$REMOTE_DIR"

if [ -f "$TAR_PATH" ]; then
  tar -xzf "$TAR_PATH" -C "$REMOTE_DIR"
fi

# Ensure Python and pip
if ! command -v python3 >/dev/null 2>&1; then
  sudo apt-get update -y
  sudo apt-get install -y python3 python3-venv python3-pip
fi

# Create venv
python3 -m venv venv
. venv/bin/activate
pip install --upgrade pip
if [ -f requirements.txt ]; then
  pip install -r requirements.txt
fi

# Try to find existing DB and copy
OLD_DB=$(sudo find / -type f -name atnaltik.db 2>/dev/null | head -n1 || true)
if [ -n "$OLD_DB" ]; then
  mkdir -p database
  cp "$OLD_DB" database/atnaltik.db || true
fi

# Create systemd service
sudo tee /etc/systemd/system/atnaltik.service > /dev/null <<'SERVICE'
[Unit]
Description=Atnaltik Flask app
After=network.target

[Service]
User=ubuntu
WorkingDirectory=/home/ubuntu/atnaltik_deploy
Environment=HOME=/home/ubuntu
ExecStart=/home/ubuntu/atnaltik_deploy/venv/bin/python run.py
Restart=always

[Install]
WantedBy=multi-user.target
SERVICE

sudo systemctl daemon-reload
sudo systemctl enable --now atnaltik.service

echo "REMOTE SETUP COMPLETE"
