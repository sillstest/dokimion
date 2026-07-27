# security_hardening H1 (part 2) — LB client certificate, STAGING. NOT YET ENABLED.
#
# Included from `location /` in load_balancer.conf, alongside the existing
# proxy_ssl_verify directives. Presenting this cert is what lets the web servers
# run `ssl_verify_client on` (staging/s-dokimion{1,2,3}/lb_mtls.h).
# Enable the LB side FIRST — presenting a client cert to a server that does not
# ask for one is harmless, so this can go live before the web servers switch on
# verification.
#
# proxy_ssl_certificate     /etc/nginx/sites-available/lb-client.crt;
# proxy_ssl_certificate_key /etc/nginx/sites-available/lb-client.key;
