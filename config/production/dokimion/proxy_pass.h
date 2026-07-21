
proxy_ssl_trusted_certificate /etc/nginx/sites-available/dokimion-staging.crt;
proxy_ssl_name dokimion1.psonet;    # any name in the shared cert's SAN is fine

proxy_pass http://prod_servers$empty;
