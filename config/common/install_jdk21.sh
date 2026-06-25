#!/bin/bash
#
# install_jdk21.sh - Install Temurin JDK 21 SYSTEM-WIDE via SDKMAN, so all users (including the
# 'dokimion' service account) can use it, and expose it at the stable path /opt/jdk-21 that the
# dokimion startup scripts look for.
#
# Run on each runtime box that should run on JDK 21 (dokimion1, dokimion2, dokimion3.psonet, ...).
# Requires sudo. Idempotent-ish: safe to re-run; it refreshes the install and the /opt/jdk-21 symlink.
#
#   sudo config/common/install_jdk21.sh
#
# After it succeeds, deploy normally (the startup scripts auto-select /opt/jdk-21):
#   cd ~/dokimion && sudo config/common/deploy.sh <N> prod
#
set -eu

JDK_ID="21.0.11-tem"                  # match the version used on the other boxes
SDKMAN_DIR_SYS="/usr/local/sdkman"
JDK_LINK="/opt/jdk-21"

if [ "$(id -u)" -ne 0 ]; then
  echo "ERROR: run with sudo (root needed to write /usr/local/sdkman, /etc/profile.d, /opt)." >&2
  exit 1
fi

echo "==> 0. Prerequisites (curl, zip, unzip)"
apt-get update && apt-get install -y curl zip unzip

echo "==> 1. Install SDKMAN to ${SDKMAN_DIR_SYS} (rcupdate=false: don't touch root's shell rc)"
if [ ! -s "${SDKMAN_DIR_SYS}/bin/sdkman-init.sh" ]; then
  export SDKMAN_DIR="${SDKMAN_DIR_SYS}"
  curl -s "https://get.sdkman.io?rcupdate=false" | bash
else
  echo "    (already present at ${SDKMAN_DIR_SYS})"
fi

echo "==> 2. Install Temurin JDK ${JDK_ID}"
export SDKMAN_DIR="${SDKMAN_DIR_SYS}"
# shellcheck disable=SC1091
source "${SDKMAN_DIR_SYS}/bin/sdkman-init.sh"
sdk install java "${JDK_ID}" || {
  echo "ERROR: 'sdk install java ${JDK_ID}' failed. List options with:" >&2
  echo "  sudo bash -c 'source ${SDKMAN_DIR_SYS}/bin/sdkman-init.sh; sdk list java'" >&2
  echo "then set JDK_ID at the top of this script to the current 21.x-tem and re-run." >&2
  exit 1
}

echo "==> 3. Make it readable/executable by all users + auto-load for login shells"
chmod -R a+rX "${SDKMAN_DIR_SYS}"
tee /etc/profile.d/sdkman.sh >/dev/null <<EOF
export SDKMAN_DIR=${SDKMAN_DIR_SYS}
[ -s "${SDKMAN_DIR_SYS}/bin/sdkman-init.sh" ] && source "${SDKMAN_DIR_SYS}/bin/sdkman-init.sh"
EOF

echo "==> 4. Bridge to the stable path the startup scripts check first: ${JDK_LINK}"
ln -sfn "${SDKMAN_DIR_SYS}/candidates/java/${JDK_ID}" "${JDK_LINK}"

echo "==> 5. Verify"
"${JDK_LINK}/bin/java" -version
if id dokimion >/dev/null 2>&1; then
  echo "    (as the 'dokimion' service account:)"
  sudo -u dokimion "${JDK_LINK}/bin/java" -version
fi

echo
echo "DONE. JDK 21 is at ${JDK_LINK}. Deploy with:  cd ~/dokimion && sudo config/common/deploy.sh <N> prod"
echo "Confirm the service uses it:  journalctl -u dokimion<N>_server.service -n40 | grep -E 'JAVA_BIN=|21\\.0'"
