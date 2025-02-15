#!/bin/bash

# DigitalOcean API Token
API_TOKEN="YOUR_API_TOKEN"

# Configuration
DROPLET_NAME="my-new-droplet"
REGION="nyc3"
SIZE="s-1vcpu-1gb"
IMAGE="ubuntu-22-04-x64"
SSH_KEY_ID="YOUR_SSH_KEY_ID"
SSH_PRIVATE_KEY_PATH="/path/to/private/key"

# Check required commands
command -v curl >/dev/null 2>&1 || { echo >&2 "curl required but not found."; exit 1; }
command -v jq >/dev/null 2>&1 || { echo >&2 "jq required but not found."; exit 1; }
command -v ssh >/dev/null 2>&1 || { echo >&2 "ssh required but not found."; exit 1; }

# Create droplet
echo "Creating droplet..."
response=$(curl -s -X POST \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $API_TOKEN" \
  -d '{
    "name":"'"$DROPLET_NAME"'",
    "region":"'"$REGION"'",
    "size":"'"$SIZE"'",
    "image":"'"$IMAGE"'",
    "ssh_keys":['"$SSH_KEY_ID"'],
    "backups":false
  }' \
  "https://api.digitalocean.com/v2/droplets")

DROPLET_ID=$(echo "$response" | jq -r '.droplet.id')
if [ -z "$DROPLET_ID" ] || [ "$DROPLET_ID" = "null" ]; then
  echo "Failed to create droplet. Error:"
  echo "$response" | jq .
  exit 1
fi

echo "Droplet created with ID: $DROPLET_ID"

# Wait for droplet to become active
echo -n "Waiting for droplet to become active..."
while true; do
  status=$(curl -s -H "Authorization: Bearer $API_TOKEN" \
    "https://api.digitalocean.com/v2/droplets/$DROPLET_ID" | \
    jq -r '.droplet.status')
  [ "$status" = "active" ] && break
  echo -n "."
  sleep 10
done
echo " Active!"

# Get droplet IP
DROPLET_IP=$(curl -s -H "Authorization: Bearer $API_TOKEN" \
  "https://api.digitalocean.com/v2/droplets/$DROPLET_ID" | \
  jq -r '.droplet.networks.v4[0].ip_address')

echo "Droplet IP: $DROPLET_IP"

# Wait for SSH to be ready
echo -n "Waiting for SSH..."
sleep 30  # Initial wait - adjust based on typical droplet creation time
while ! nc -z $DROPLET_IP 22; do
  sleep 2
done
echo " Ready!"

# SSH into droplet and execute script
echo "Executing remote script..."
ssh -i "$SSH_PRIVATE_KEY_PATH" \
  -o StrictHostKeyChecking=no \
  -o UserKnownHostsFile=/dev/null \
  root@$DROPLET_IP /bin/bash << 'END_SCRIPT'
#!/bin/bash

# Remote script content
echo "=== System Information ==="
uname -a
echo "=== Disk Space ==="
df -h
echo "=== Hello from $(hostname) ==="
END_SCRIPT

echo "Script execution completed on droplet."
