upstream prod_servers {
        ip_hash;
        #least_conn;
        #hash $request_uri;
        server dokimion1.psonet:443 max_fails=5 fail_timeout=60s;
        server dokimion2.psonet:443 max_fails=5 fail_timeout=60s;
        server dokimion3.psonet:443 max_fails=5 fail_timeout=60s;

        # number of keep alive connections to upstream
        # servers preserved in the cache of each worker process
        keepalive 64;
}
