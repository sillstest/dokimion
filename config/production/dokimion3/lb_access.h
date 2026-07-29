# security_hardening H1 (part 1) — source restriction, PRODUCTION web server.
#
# Included from the `listen 443 ssl` server block of dokimion_common.conf, which is
# shared with staging. Only the production LB, the three web boxes themselves, and
# on-box loopback may reach :443 directly. Every other source gets 403.
#
# Addresses verified on 2026-07-29, all empirically:
#   10.3.0.43   dokimion.psonet   — LB. `ss -tnH 'sport = :443'` on all three web
#                                   boxes showed this as the only external peer.
#   10.3.0.139  dokimion1.psonet  — see below
#   10.3.0.145  dokimion3.psonet
#   10.3.0.213  dokimion2.psonet
#
# Why the web boxes need to be listed, and why `allow 127.0.0.1` is NOT enough:
# a request to https://dokimion1.psonet from dokimion1 resolves to that box's LAN
# address, and Linux then selects the same address as the source --
#   `ip route get 10.3.0.139` -> "local 10.3.0.139 dev lo src 10.3.0.139"
# so on-box checks arrive as 10.3.0.139, never as 127.0.0.1. The access logs
# confirm it: each box's own LAN IP appears in its own log, and dokimion2's log
# also shows dokimion1 and dokimion3. Loopback is kept for `curl 127.0.0.1`.
#
# ⚠️ WHEN AUDITING THE ACCESS LOG, MIND THE TWO LOG FORMATS. /var/log/nginx/access.log
# holds both `upstreamlog` (nginx.conf, "[$time_local] $remote_addr ...") for most
# requests AND the built-in `combined` ("$remote_addr ...") for location /api. So
# `awk '{print $1}'` reads timestamps for the majority of lines and silently
# under-reports clients. Use:
#   sudo zcat -f /var/log/nginx/access.log* \
#     | awk '{print ($1 ~ /^\[/) ? $3 : $1}' | sort | uniq -c | sort -rn | head -20
#
# Failure mode is 403 while mTLS (lb_mtls.h) is off. Once mTLS is enabled,
# unauthorised requests fail earlier with 400 and adding an IP here will NOT help --
# ssl_verify_client is evaluated before the access phase.
#
# TO ROLL BACK: replace the directives below with `allow all;`, then
#   sudo nginx -t && sudo systemctl reload nginx

allow 10.3.0.43;     # dokimion.psonet  — production load balancer (eth0)
allow 10.3.0.139;    # dokimion1.psonet — self / peer checks
allow 10.3.0.213;    # dokimion2.psonet — self / peer checks
allow 10.3.0.145;    # dokimion3.psonet — self / peer checks
allow 127.0.0.1;     # on-box loopback
deny  all;
