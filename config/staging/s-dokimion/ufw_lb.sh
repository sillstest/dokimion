#!/bin/bash
#
# ufw_lb.sh — enable a host firewall on the STAGING load balancer (s-dokimion.psonet).
#
# Opens only what the LB needs to be reached on:
#   - SSH     (default port 32; override with SSH_PORT=NN)
#   - 443/tcp (public HTTPS)
# Default policy: deny incoming, allow outgoing.
#
# SAFE RE-ENABLE (dead-man's switch):
#   Running with no argument ARMS an auto-rollback: it schedules a detached
#   `ufw disable` ROLLBACK_SECS from now (default 180), THEN enables ufw. If the
#   new rules lock you out, the firewall disables itself and access returns.
#   To keep the firewall, open a NEW ssh session and run:  sudo ./ufw_lb.sh confirm
#   which cancels the pending rollback. If you can't get back in, do nothing and
#   wait ~ROLLBACK_SECS.
#
# Why the reset + IPv6 handling: the first attempt locked SSH out despite an
# `allow 32/tcp`. Two likely causes are covered here — a pre-existing/conflicting
# ufw rule (cleared by `ufw --force reset`) and IPv6 SSH not being allowed
# (forced on via IPV6=yes). The auto-rollback covers anything we haven't foreseen.
#
# Scope guard: refuses to run anywhere except s-dokimion (staging LB).
#
# Usage (on s-dokimion.psonet, as root):
#   sudo ./ufw_lb.sh            # reset, add rules, arm rollback, enable
#   sudo ./ufw_lb.sh confirm    # cancel the pending auto-rollback (keep firewall)
#
set -euo pipefail

SSH_PORT="${SSH_PORT:-32}"
ROLLBACK_SECS="${ROLLBACK:-180}"
PIDFILE=/run/ufw_lb_rollback.pid
LOG=/var/log/ufw_lb_rollback.log
MODE="${1:-arm}"

# --- guards (both modes) ----------------------------------------------------
host="$(hostname)"; host="${host%%.*}"
if [ "$host" != "s-dokimion" ]; then
  echo "ERROR: this script only runs on s-dokimion (staging LB); host is '$host'. Aborting." >&2
  exit 1
fi
if [ "$(id -u)" -ne 0 ]; then
  echo "ERROR: must run as root. Re-run: sudo $0 ${MODE}" >&2
  exit 1
fi
command -v ufw >/dev/null 2>&1 || { echo "ERROR: ufw not installed (apt-get install ufw)." >&2; exit 1; }

# --- confirm mode: cancel the pending auto-rollback -------------------------
if [ "$MODE" = "confirm" ]; then
  if [ -f "$PIDFILE" ] && kill "$(cat "$PIDFILE")" 2>/dev/null; then
    echo "auto-rollback cancelled — firewall will stay enabled."
  else
    echo "no active rollback found (already cancelled, or it already fired)."
  fi
  rm -f "$PIDFILE"
  echo "current state:"; ufw status verbose
  exit 0
fi
if [ "$MODE" != "arm" ]; then
  echo "usage: sudo $0 [confirm]" >&2; exit 2
fi

# --- lockout safety: sshd MUST be listening on SSH_PORT before we enable ----
if ! ss -ltn 2>/dev/null | grep -q ":${SSH_PORT}\b"; then
  echo "ERROR: no listener on port ${SSH_PORT}; refusing to enable ufw (would lock out SSH)." >&2
  echo "       Find the real SSH port and re-run: sudo SSH_PORT=<port> $0" >&2
  exit 1
fi

echo "host=$host  ssh_port=$SSH_PORT  rollback=${ROLLBACK_SECS}s"

# --- start from a clean slate (drops any conflicting pre-existing rules) -----
ufw --force reset >/dev/null

# --- make sure IPv6 rules are generated (covers SSH over IPv6) --------------
if [ -f /etc/default/ufw ]; then
  sed -i 's/^IPV6=.*/IPV6=yes/' /etc/default/ufw
fi

# --- rules + default policy -------------------------------------------------
ufw allow "${SSH_PORT}/tcp" comment 'ssh'
ufw allow 443/tcp           comment 'https (public LB)'
# The LB's :80 vhost 301-redirects HTTP->HTTPS. To keep that working for clients
# hitting http://, also open 80 (off by default per the 443-only request):
#   ufw allow 80/tcp comment 'http redirect'
ufw default deny incoming
ufw default allow outgoing

# --- arm the dead-man's switch BEFORE enabling ------------------------------
# Detached (nohup + disown) so it survives even if this SSH session is dropped.
nohup bash -c "sleep ${ROLLBACK_SECS}; ufw --force disable; rm -f '${PIDFILE}'" >>"$LOG" 2>&1 &
echo $! > "$PIDFILE"
disown || true
echo "armed auto-rollback: ufw will DISABLE itself in ${ROLLBACK_SECS}s (pid $(cat "$PIDFILE"))"

# --- enable -----------------------------------------------------------------
ufw --force enable
echo
ufw status verbose
echo
echo "=============================================================="
echo " Firewall ENABLED, but auto-rollback is armed (${ROLLBACK_SECS}s)."
echo " From a NEW ssh session, verify you can still get in, then run:"
echo "     sudo $0 confirm"
echo " to keep it. Do nothing and it disables itself (access returns)."
echo "=============================================================="
