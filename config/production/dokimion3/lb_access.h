# security_hardening H1 (part 1) — source restriction, PRODUCTION web server.
#
# Included from the `listen 443 ssl` server block of dokimion_common.conf, which is
# shared with staging. ENFORCING as of 2026-07-29: only the production load balancer
# and on-box localhost may reach :443 directly. Every other source gets 403.
#
# LB source address verified empirically on 2026-07-29, not inferred: with traffic
# flowing through the LB, `ss -tnH 'sport = :443'` on dokimion{1,2,3} showed exactly
# one peer, 10.3.0.43, on all three boxes. (dokimion.psonet eth0 = 10.3.0.43/8.)
#
# ⚠️ BEFORE DEPLOYING THIS, list who else reaches the box directly:
#     sudo awk '{print $1}' /var/log/nginx/access.log | sort | uniq -c | sort -rn | head -20
#   Anything other than 10.3.0.43 and 127.0.0.1 will start receiving 403. On staging
#   this rollout broke the Selenium suite, whose .runsettings targets a web box
#   directly. Add legitimate clients here first, or repoint them at the LB.
#
# Note the failure mode is 403 while mTLS (lb_mtls.h) remains off. Once mTLS is
# enabled, unauthorised requests fail earlier with 400 and an IP exemption added
# here will NOT help -- ssl_verify_client is evaluated before the access phase.
#
# TO ROLL BACK: replace the three directives below with `allow all;`, then
#   sudo nginx -t && sudo systemctl reload nginx

allow 10.3.0.43;    # dokimion.psonet — production load balancer (eth0)
allow 127.0.0.1;    # on-box health checks / local curl
deny  all;
