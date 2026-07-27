# security_hardening H1 (part 1) — source restriction, STAGING web server.
#
# Included from the `listen 443 ssl` server block of dokimion_common.conf.
# Only the staging load balancer may talk to this backend directly; a direct
# client would otherwise bypass the LB's rate limiting, security headers and the
# Cloudflare/WAF layer, and could forge X-Forwarded-For / X-Real-IP.
#
# LB source address verified 2026-07-27: on s-dokimion.psonet,
#   `ip route get <web-box-ipv4>` -> "dev eth0 src 10.3.0.171"
# for all three upstreams. The web servers listen on 0.0.0.0:443 (IPv4 only),
# so the IPv4 address is the only one that can appear as $remote_addr.

allow 10.3.0.171;   # s-dokimion.psonet — staging load balancer (eth0)
allow 127.0.0.1;    # on-box health checks / local curl

# BEFORE DEPLOYING: Dokimion_Tests/.runsettings targets
# http://s-dokimion3.psonet directly, which 301s to :443 and will then be
# denied. Either repoint the suite at the load balancer, or allow the runner:
# allow <selenium-runner-ipv4>;   # Dokimion_Tests runner

deny all;
