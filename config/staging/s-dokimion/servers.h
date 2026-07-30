# Upstreams are IPv4 LITERALS, not hostnames. s-dokimion1/2/3.psonet each publish
# both an A (10.3.0.x) and an AAAA (fd80:…) record, and nginx resolves upstream names
# once at load time — it was picking the IPv6 address, but the web servers listen on
# 0.0.0.0:443 (IPv4 only, see lb_access.h), so every connect() got "111: Connection
# refused", all upstreams were disabled, and the LB served an error page. Pinning to the
# A records forces IPv4. TLS/SNI and upstream cert verification are unaffected: proxy_pass.h
# sets proxy_ssl_name s-dokimion1.psonet (in the shared SAN) explicitly.
#   10.3.0.199 = s-dokimion1.psonet, 10.3.0.72 = s-dokimion2.psonet, 10.3.0.236 = s-dokimion3.psonet
upstream stage_servers {
        ip_hash;
        #least_conn;
        #hash $request_uri;
        server 10.3.0.199:443 max_fails=5 fail_timeout=60s;   # s-dokimion1.psonet
        server 10.3.0.72:443  max_fails=5 fail_timeout=60s;   # s-dokimion2.psonet
        server 10.3.0.236:443 max_fails=5 fail_timeout=60s;   # s-dokimion3.psonet

        # number of keep alive connections to upstream
        # servers preserved in the cache of each worker process
        keepalive 64;
}
