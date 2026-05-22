param(
    [string]$PemPath = "C:\Users\Shohjahon\OneDrive\Desktop\atnaltik.pem",
    [string]$User = "ubuntu",
    [string]$Host = "54.235.127.29",
    [string]$RemoteDir = "/home/ubuntu/atnaltik_deploy",
    [string]$Tar = "atnaltik.tar.gz"
)

Write-Output "Starting deploy to $User@$Host using key $PemPath"

# Upload tarball and .env
Write-Output "Uploading $Tar and .env to remote..."
scp -i "$PemPath" $Tar $User@$Host:/home/ubuntu/ | Out-Null
scp -i "$PemPath" .env $User@$Host:/home/ubuntu/ | Out-Null

# Remote commands: create dir, extract, setup venv, install, copy DB from existing installation
$remoteCmd = @'
set -e
mkdir -p {REMOTE_DIR}
cd {REMOTE_DIR}
# Extract uploaded tar (it should contain project files)
if [ -f /home/ubuntu/{TAR} ]; then
  tar -xzf /home/ubuntu/{TAR} -C {REMOTE_DIR}
fi
# Ensure python3 and pip available
which python3 >/dev/null 2>&1 || sudo apt-get update -y && sudo apt-get install -y python3 python3-venv python3-pip
# Create venv
python3 -m venv venv
. venv/bin/activate
pip install --upgrade pip
if [ -f requirements.txt ]; then
  pip install -r requirements.txt
fi
# Try find existing atnaltik.db on server and copy into new project
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
WorkingDirectory={REMOTE_DIR}
Environment=HOME=/home/ubuntu
ExecStart={REMOTE_DIR}/venv/bin/python run.py
Restart=always

[Install]
WantedBy=multi-user.target
SERVICE

sudo systemctl daemon-reload
sudo systemctl enable --now atnaltik.service
'@

$remoteCmd = $remoteCmd -replace "\{REMOTE_DIR\}", $RemoteDir
$remoteCmd = $remoteCmd -replace "\{TAR\}", $Tar

Write-Output "Running remote setup commands..."
ssh -i "$PemPath" $User@$Host $remoteCmd

Write-Output "Deploy finished. Service should be running on the remote host."