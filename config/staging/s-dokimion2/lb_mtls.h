# security_hardening H1 (part 2) — mutual TLS, STAGING web server. NOT YET ENABLED.
#
# Included from the `listen 443 ssl` server block of dokimion_common.conf.
# Deliberately inert: enabling ssl_verify_client while the CA file is absent
# makes nginx fail to start. Uncomment only after
#   1. the internal CA from H2 exists and lb-client-ca.crt is installed here, and
#   2. the LB presents its client cert (staging/s-dokimion/lb_client_cert.h).
# Roll one node at a time and watch the LB error log for handshake failures.
#
# ssl_verify_client      on;
# ssl_client_certificate /etc/nginx/sites-available/lb-client-ca.crt;
