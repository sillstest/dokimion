
# Allow short bursts, then throttle
limit_req zone=general burst=20 nodelay;
limit_conn conn_limit 20;

# Return 429 instead of default 503 (more semantically correct)
limit_req_status 429;
limit_conn_status 429;
