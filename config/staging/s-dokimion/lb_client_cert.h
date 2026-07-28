# security_hardening H1 (part 2) — LB client certificate, STAGING. NOT YET ENABLED.
#
# Included from `location /` in load_balancer.conf, next to the existing upstream
# verification directives. Presenting this certificate is what lets the web servers
# turn on ssl_verify_client (staging/*/lb_mtls.h).
#
# Enable the LB side FIRST: offering a client certificate to a server that does not
# ask for one is a no-op, so this is safe to deploy on its own.
# To enable, uncomment exactly the two directive lines below.
# See mtls_h1_deploy.md, Phase 4.
#
#--BEGIN-DIRECTIVES--
proxy_ssl_certificate     /etc/nginx/sites-available/lb-client.crt;
proxy_ssl_certificate_key /etc/nginx/sites-available/lb-client.key;
#--END-DIRECTIVES--
