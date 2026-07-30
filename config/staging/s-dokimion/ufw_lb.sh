#!/bin/bash
#
# ufw_lb.sh — enable a host firewall on the STAGING load balancer (s-dokimion.psonet).
#
# Opens only what the LB needs to be reached on:
#   - SSH  (default port 32; override with SSH_PORT=NN)  -- allowed FIRST, so enabling ufw
#     cannot lock this session out
#   - 443/tcp (public HTTPS)
# Default policy: deny incoming, allow outgoing.
#
# Scope guard: refuses to run anywhere except s-dokimion (staging LB). Production
# (dokimion.psonet) is deliberately OUT of scope for this run.
#
# Run ON s-dokimion.psonet, as root:   sudo ./ufw_lb.sh
#
set -euo pipefail

SSH_PORT="${SSH_PORT:-32}"

# --- scope + preconditions --------------------------------------------------
host="$(hostname)"; host="${host%%.*}"
if [ "$host" != "s-dokimion" ]; then
  echo "ERROR: this script only runs on s-dokimion (staging LB); host is '$host'. Aborting." >&2
  exit 1
fi
if [ "$(id -u)" -ne 0 ]; then
  echo "ERROR: must run as root. Re-run: sudo $0" >&2
  exit 1
fi
command -v ufw >/dev/null 2>&1 || { echo "ERROR: ufw not installed (apt-get install ufw)." >&2; exit 1; }

# --- lockout safety: sshd MUST be listening on SSH_PORT before we enable ----
if ! ss -ltn 2>/dev/null | grep -q ":${SSH_PORT}\b"; then
  echo "ERROR: no listener on port ${SSH_PORT}; refusing to enable ufw (would lock out SSH)." >&2
  echo "       Check the real SSH port and re-run: sudo SSH_PORT=<port> $0" >&2
  exit 1
fi

echo "host=$host  ssh_port=$SSH_PORT  -> configuring ufw"

# --- rules: SSH first, then HTTPS, then default policy ----------------------
ufw allow "${SSH_PORT}/tcp" comment 'ssh'
ufw allow 443/tcp           comment 'https (public LB)'

# The LB's :80 vhost 301-redirects HTTP->HTTPS. If you want that redirect to keep
# working for clients that hit http://, also open 80 (left off per the 443-only request):
#   ufw allow 80/tcp comment 'http redirect'

ufw default deny incoming
ufw default allow outgoing

# --force: non-interactive enable (no y/N prompt)
ufw --force enable

echo
ufw status verbose
