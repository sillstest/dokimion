#!/bin/bash

# $1 - UI_NO

cd /home/dokimion/dokimion/src
#export NODE_OPTIONS=--openssl-legacy-provider
#npm install --legacy-peer-deps
export NODE_OPTIONS=--openssl-legacy-provider --require appmetrics/start
#/usr/bin/npm start 
pm2 start npm -- start



