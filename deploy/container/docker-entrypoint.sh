#!/usr/bin/env bash
#
# Renders /etc/dokimion/quack.properties from env, then starts nginx (:80) and jetty-runner +
# quack.war (:8080). Secrets arrive as env vars (on EKS: ConfigMap + Secret). Nothing sensitive
# is baked into the image.
#
# Mongo:  set MONGO_URI (plain connection string) — the preferred path; it bypasses the app's
#         AES-encrypted mongo.password logic. Example:
#           mongodb://mongo-0.mongo.dokimion.svc.cluster.local:27017/?replicaSet=rs0
# Admin:  AUTH_ADMIN_PASSWORD must be the AES-CIPHERTEXT of the admin password (the app compares
#         md5(entered) == md5(aes.decrypt(auth.admin.password))). Produce it with
#         deploy/eks/aes-encrypt.java. Injecting plaintext makes admin login fail.
set -euo pipefail

# ---- structural / non-secret defaults (override via env) -------------------
: "${MONGO_URI:=}"                      # preferred; when set, replicaSet/username/password are ignored
: "${MONGO_REPLICASET:=}"              # fallback only (needs AES-encrypted MONGO_PASSWORD)
: "${MONGO_DBNAME:=dokimion}"
: "${MONGO_USERNAME:=}"                # empty => app adds no credentials
: "${MONGO_PASSWORD:=}"
: "${WHORU_AUTH_PROVIDER:=com.testquack.api.security.DbAuthProvider}"
: "${WHORU_SESSION_PROVIDER:=ru.greatbit.whoru.auth.providers.HazelcastSessionProvider}"
: "${STUB_LOGIN:=somelogin}"
: "${AUTH_DOMAIN:=localhost}"
: "${AUTH_SESSION_TTL:=6000000}"
: "${AUTH_ADMIN_LOGIN:=admin}"
: "${AUTH_ADMIN_LOGINS:=}"
: "${ENTITY_LOCK_TTL_MIN:=5}"
: "${HAZELCAST_GROUP_NAME:=dokimion}"
: "${HAZELCAST_GROUP_PASSWORD:=dokimion}"
: "${HAZELCAST_TTL_SEC:=1209600}"
: "${HAZELCAST_PORT:=5903}"
: "${HAZELCAST_BACKUP_COUNT:=1}"
: "${HAZELCAST_TCPIP_ENABLED:=true}"
: "${STORAGE_PROVIDER:=com.testquack.storage.MongoStorage}"
: "${QUACK_TRACKER:=com.testquack.tracker.DummyTracker}"
: "${QUACK_TURNSTILE_SECRET:=1x0000000000000000000000000000000AA}"
: "${QUACK_API_ENDPOINT:=http://localhost/api}"   # self-reference via the in-pod nginx (NOT the public URL)
: "${QUACK_UI_URL:=http://localhost}"
: "${QUACK_MULTI_ORG_MODE:=false}"
: "${QUACK_ORGS_ENABLED:=false}"
: "${QUACK_ORG_SESSIONS_CAPACITY:=5}"

umask 077
mkdir -p /etc/dokimion
PROPS=/etc/dokimion/quack.properties
TURN=/etc/dokimion/cloudflareTurnstile.properties

# If a quack.properties is already present (mounted from a file/Secret), USE IT AS-IS and skip
# env-rendering. Otherwise render it from the env defaults above. This lets a deployment supply
# the real config file (deploy/quack.properties) instead of env vars.
if [ -f "$PROPS" ]; then
  echo "[entrypoint] using provided $PROPS (mounted) — skipping env render"
else
  # ---- required (only when rendering from env) ----
  if [ -z "${MONGO_URI}" ] && [ -z "${MONGO_REPLICASET}" ]; then
    echo "ERROR: set MONGO_URI (preferred) or MONGO_REPLICASET" >&2; exit 1
  fi
  : "${AUTH_ADMIN_PASSWORD:?AUTH_ADMIN_PASSWORD is required (AES ciphertext — see deploy/eks/aes-encrypt.java)}"

  export MONGO_URI MONGO_REPLICASET MONGO_DBNAME MONGO_USERNAME MONGO_PASSWORD \
    WHORU_AUTH_PROVIDER WHORU_SESSION_PROVIDER STUB_LOGIN AUTH_DOMAIN AUTH_SESSION_TTL \
    AUTH_ADMIN_LOGIN AUTH_ADMIN_PASSWORD AUTH_ADMIN_LOGINS ENTITY_LOCK_TTL_MIN \
    HAZELCAST_GROUP_NAME HAZELCAST_GROUP_PASSWORD HAZELCAST_TTL_SEC HAZELCAST_PORT \
    HAZELCAST_BACKUP_COUNT HAZELCAST_TCPIP_ENABLED STORAGE_PROVIDER QUACK_TRACKER \
    QUACK_TURNSTILE_SECRET QUACK_API_ENDPOINT QUACK_UI_URL QUACK_MULTI_ORG_MODE \
    QUACK_ORGS_ENABLED QUACK_ORG_SESSIONS_CAPACITY

  envsubst < /opt/dokimion/quack.properties.tmpl > "$PROPS"
  chmod 600 "$PROPS"
  echo "[entrypoint] rendered $PROPS from env (mongo.uri set: $([ -n "$MONGO_URI" ] && echo yes || echo no), domain=${AUTH_DOMAIN})"
fi

# TurnstileProperties loads this file in a STATIC initializer and throws if it is missing, which
# makes UserResource (and every /api/user/* call) 500. It reads app.secret as the Cloudflare
# Turnstile verify secret. Render it if not already provided; prefer the secret from a mounted
# quack.properties (its quack.turnstile.secret), else the QUACK_TURNSTILE_SECRET env default.
if [ ! -f "$TURN" ]; then
  turn_secret=""
  [ -f "$PROPS" ] && turn_secret="$(sed -n 's/^[[:space:]]*quack\.turnstile\.secret[[:space:]]*=//p' "$PROPS" | head -1)"
  printf 'app.secret=%s\n' "${turn_secret:-${QUACK_TURNSTILE_SECRET}}" > "$TURN"
  chmod 600 "$TURN"
fi

# nginx in the background; if it dies, take the pod down so Kubernetes restarts it
nginx -g 'daemon off;' &
NGINX_PID=$!
( wait "$NGINX_PID"; echo "[entrypoint] nginx exited"; kill -TERM 1 2>/dev/null ) &

exec java \
  -Dspring.hazelcast.enable="${SPRING_HAZELCAST_ENABLE:-false}" \
  ${JAVA_OPTS:--Xms512m -Xmx2g -XX:+UseG1GC -XX:MaxMetaspaceSize=512m} \
  -Xbootclasspath/a:/etc/dokimion \
  -jar /opt/dokimion/lib/jetty-runner.jar \
  --port 8080 \
  /opt/dokimion/quack.war
