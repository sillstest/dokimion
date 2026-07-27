# security_hardening H1 (part 1) — source restriction, PRODUCTION web server.
#
# Included from the `listen 443 ssl` server block of dokimion_common.conf, which
# is shared with staging. This file exists so that shared config keeps working on
# production; it is INTENTIONALLY PERMISSIVE so the H1 change lands on staging
# first. Production behaviour is unchanged.
#
# LB source address verified 2026-07-27: on dokimion.psonet,
#   `ip route get <web-box-ipv4>` -> "dev eth0 src 10.3.0.43"
# for dokimion{1,2,3}.psonet.
#
# TO ENFORCE ON PRODUCTION, replace the `allow all;` below with:
#   allow 10.3.0.43;    # dokimion.psonet — production load balancer (eth0)
#   allow 127.0.0.1;    # on-box health checks / local curl
#   deny  all;
# Check the access log for other legitimate direct clients (monitoring, test
# runners) before doing so.

allow all;
