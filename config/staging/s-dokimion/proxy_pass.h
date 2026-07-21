
proxy_ssl_trusted_certificate /etc/nginx/sites-available/s-dokimion-staging.crt;
proxy_ssl_name s-dokimion1.psonet;    # any name in the shared cert's SAN is fine

proxy_pass https://stage_servers$empty;
