upstream prod_servers {
        ip_hash;
        #least_conn;
        #hash $request_uri;
#
#  using ipv4 addresses to avoid dns lookup of ipv6 addresses
#
#server dokimion1.psonet:443 max_fails=5 fail_timeout=60s;
	server 10.3.0.139:443 max_fails=5 fail_timeout=60s;
#server dokimion2.psonet:443 max_fails=5 fail_timeout=60s;
        server 10.3.0.213:443 max_fails=5 fail_timeout=60s;
#server dokimion3.psonet:443 max_fails=5 fail_timeout=60s;
        server 10.3.0.145:443 max_fails=5 fail_timeout=60s;

        # number of keep alive connections to upstream
        # servers preserved in the cache of each worker process
        keepalive 64;
}
