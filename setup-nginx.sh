#!/usr/bin/env bash
# One-time nginx + SSL setup for event.178.104.32.204.sslip.io
# Run as root from /opt/sittings after cloning.
# Safe to re-run — all steps are idempotent.
set -euo pipefail

DOMAIN="event.178.104.32.204.sslip.io"
EMAIL="kobisc@postil.com"
GIRON_DIR="/opt/giron-security"
NGINX_CONF="$GIRON_DIR/nginx/nginx.conf"
NGINX_SSL="$GIRON_DIR/nginx/ssl"
CERTBOT_WEBROOT="$GIRON_DIR/nginx/certbot"

echo "=== Event Seating Planner — nginx + SSL setup ==="

[[ $EUID -ne 0 ]] && { echo "Run as root (sudo bash setup-nginx.sh)"; exit 1; }

# ── 1. docker0 IP ──────────────────────────────────────────────────────────
HOST_IP=$(ip addr show docker0 2>/dev/null | awk '/inet /{print $2}' | cut -d/ -f1)
HOST_IP=${HOST_IP:-172.17.0.1}
echo "[1/7] docker0 IP: $HOST_IP"

# ── 2. certbot ─────────────────────────────────────────────────────────────
if ! command -v certbot &>/dev/null; then
  echo "[2/7] Installing certbot..."
  apt-get update -qq && apt-get install -y -qq certbot
else
  echo "[2/7] certbot already installed"
fi

# ── 3. certbot webroot dir + docker-compose volume ─────────────────────────
mkdir -p "$CERTBOT_WEBROOT"
if ! grep -q "certbot" "$GIRON_DIR/docker-compose.yml"; then
  echo "[3/7] Adding certbot volume to giron-security docker-compose.yml..."
  sed -i 's|./nginx/ssl:/etc/nginx/ssl:ro|./nginx/ssl:/etc/nginx/ssl:ro\n      - ./nginx/certbot:/var/www/certbot:ro|' \
    "$GIRON_DIR/docker-compose.yml"
else
  echo "[3/7] certbot volume already present"
fi

# ── 4. HTTP server block (ACME challenge passthrough) ──────────────────────
if ! grep -q "$DOMAIN" "$NGINX_CONF"; then
  echo "[4/7] Inserting HTTP server block into nginx.conf..."
  python3 - "$NGINX_CONF" "$DOMAIN" <<'PYEOF'
import sys
path, domain = sys.argv[1], sys.argv[2]
content = open(path, encoding="utf-8").read()
block = f"""
    # ─── {domain} (HTTP + ACME) ────────────────────────────
    server {{
        listen 80;
        server_name {domain};
        location /.well-known/acme-challenge/ {{ root /var/www/certbot; }}
        location / {{ return 301 https://$host$request_uri; }}
    }}

"""
# Insert before the catch-all HTTP redirect server block
anchor = "    # ─── HTTP → HTTPS Redirect"
if anchor in content:
    content = content.replace(anchor, block + anchor, 1)
else:
    # Fallback: insert before first "server {" inside the http { } block
    import re
    content = re.sub(r'(\n    server \{)', block + r'\1', content, count=1)
open(path, "w", encoding="utf-8").write(content)
print("  HTTP block inserted")
PYEOF
else
  echo "[4/7] HTTP server block already present"
fi

# ── 5. Restart nginx to pick up new volume + config ───────────────────────
echo "[5/7] Restarting giron_nginx..."
cd "$GIRON_DIR" && docker compose restart nginx
sleep 4

# ── 6. TLS certificate ─────────────────────────────────────────────────────
if [[ ! -f "/etc/letsencrypt/live/$DOMAIN/fullchain.pem" ]]; then
  echo "[6/7] Requesting Let's Encrypt certificate..."
  certbot certonly --webroot \
    -w "$CERTBOT_WEBROOT" \
    -d "$DOMAIN" \
    --email "$EMAIL" \
    --agree-tos \
    --non-interactive
else
  echo "[6/7] Certificate already exists"
fi
cp "/etc/letsencrypt/live/$DOMAIN/fullchain.pem" "$NGINX_SSL/event-cert.pem"
cp "/etc/letsencrypt/live/$DOMAIN/privkey.pem"   "$NGINX_SSL/event-key.pem"
echo "    Certs copied to $NGINX_SSL"

# ── 7. HTTPS server block ──────────────────────────────────────────────────
if ! grep -q "event-cert.pem" "$NGINX_CONF"; then
  echo "[7/7] Inserting HTTPS server block into nginx.conf..."
  python3 - "$NGINX_CONF" "$DOMAIN" "$HOST_IP" <<'PYEOF'
import sys
path, domain, host_ip = sys.argv[1], sys.argv[2], sys.argv[3]
content = open(path, encoding="utf-8").read()
block = f"""
    # ─── {domain} (HTTPS) ──────────────────────────────────
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
if stripped.endswith("}"):
    content = stripped[:-1] + block + "}\n"
open(path, "w", encoding="utf-8").write(content)
print("  HTTPS block inserted")
PYEOF
else
  echo "[7/7] HTTPS server block already present"
fi

# ── Reload nginx ───────────────────────────────────────────────────────────
docker exec giron_nginx nginx -t && docker exec giron_nginx nginx -s reload
echo ""
echo "Done! https://$DOMAIN"
