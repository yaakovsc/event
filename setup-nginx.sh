#!/usr/bin/env bash
# nginx + SSL setup for event.178.104.32.204.sslip.io
# Run as root from /opt/sittings. Safe to re-run.
set -euo pipefail

DOMAIN="event.178.104.32.204.sslip.io"
EMAIL="yaakovsc@gmail.com"
GIRON_DIR="/opt/giron-security"
NGINX_CONF="$GIRON_DIR/nginx/nginx.conf"
NGINX_SSL="$GIRON_DIR/nginx/ssl"

echo "=== Event Seating Planner — nginx + SSL setup ==="
[[ $EUID -ne 0 ]] && { echo "Run as root: sudo bash setup-nginx.sh"; exit 1; }

# ── 1. docker0 IP ──────────────────────────────────────────────
HOST_IP=$(ip addr show docker0 2>/dev/null | awk '/inet /{print $2}' | cut -d/ -f1)
HOST_IP=${HOST_IP:-172.17.0.1}
echo "[1/6] docker0 IP: $HOST_IP"

# ── 2. certbot ─────────────────────────────────────────────────
if ! command -v certbot &>/dev/null; then
  echo "[2/6] Installing certbot..."
  apt-get update -qq && apt-get install -y -qq certbot
else
  echo "[2/6] certbot already installed"
fi

# ── 3. TLS certificate (standalone — stop nginx briefly) ───────
if [[ ! -f "/etc/letsencrypt/live/$DOMAIN/fullchain.pem" ]]; then
  echo "[3/6] Stopping giron_nginx to free port 80..."
  cd "$GIRON_DIR" && docker compose stop nginx
  echo "[3/6] Requesting Let's Encrypt certificate..."
  certbot certonly --standalone \
    -d "$DOMAIN" --email "$EMAIL" --agree-tos --non-interactive
else
  echo "[3/6] Certificate already exists"
  cd "$GIRON_DIR" && docker compose stop nginx 2>/dev/null || true
fi
cp "/etc/letsencrypt/live/$DOMAIN/fullchain.pem" "$NGINX_SSL/event-cert.pem"
cp "/etc/letsencrypt/live/$DOMAIN/privkey.pem"   "$NGINX_SSL/event-key.pem"
echo "    Certs copied"

# ── 4. Connect nginx container to web network ──────────────────
if ! docker inspect giron_nginx \
     --format '{{range .NetworkSettings.Networks}}{{.NetworkID}} {{end}}' \
     | grep -qF "$(docker network inspect web --format '{{.Id}}' 2>/dev/null)"; then
  echo "[4/6] Connecting giron_nginx to web network..."
  docker network connect web giron_nginx 2>/dev/null || true
else
  echo "[4/6] Already on web network"
fi

# ── 5. Patch nginx.conf ────────────────────────────────────────
echo "[5/6] Patching nginx.conf..."
python3 - "$NGINX_CONF" "$DOMAIN" "$HOST_IP" <<'PYEOF'
import sys, re
path, domain, host_ip = sys.argv[1], sys.argv[2], sys.argv[3]
content = open(path, encoding="utf-8").read()

# HTTP block
http_block = f"""
    server {{
        listen 80;
        server_name {domain};
        location /.well-known/acme-challenge/ {{ root /var/www/certbot; }}
        location / {{ return 301 https://$host$request_uri; }}
    }}
"""
if domain not in content:
    anchor = "    # ─── HTTP → HTTPS Redirect"
    if anchor in content:
        content = content.replace(anchor, http_block + anchor, 1)
    else:
        content = re.sub(r'(\n    server \{)', http_block + r'\1', content, count=1)
    print("  HTTP block inserted")
else:
    print("  HTTP block already present")

# HTTPS block
if "event-cert.pem" not in content:
    https_block = f"""
    server {{
        listen 443 ssl http2;
        server_name {domain};
        ssl_certificate     /etc/nginx/ssl/event-cert.pem;
        ssl_certificate_key /etc/nginx/ssl/event-key.pem;
        ssl_protocols       TLSv1.2 TLSv1.3;
        ssl_ciphers         ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384;
        ssl_prefer_server_ciphers off;
        ssl_session_cache   shared:SSL:10m;
        ssl_session_timeout 1d;
        add_header Strict-Transport-Security "max-age=31536000" always;
        add_header X-Frame-Options "SAMEORIGIN" always;
        add_header X-Content-Type-Options "nosniff" always;
        location / {{
            proxy_pass http://{host_ip}:3456;
            proxy_http_version 1.1;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }}
    }}
"""
    stripped = content.rstrip()
    content = stripped[:-1] + https_block + "}\n"
    print("  HTTPS block inserted")
else:
    print("  HTTPS block already present")

open(path, "w", encoding="utf-8").write(content)
PYEOF

# ── 6. Start nginx ─────────────────────────────────────────────
echo "[6/6] Starting giron_nginx..."
cd "$GIRON_DIR" && docker compose start nginx
sleep 3
if docker ps --filter "name=giron_nginx" --filter "status=running" | grep -q giron_nginx; then
  echo ""
  echo "Done! https://$DOMAIN"
else
  echo "nginx failed to start — check: docker logs giron_nginx --tail 30"
  exit 1
fi
