#!/bin/bash

# $1 - UI_NO

cd /home/dokimion/dokimion/src
#export NODE_OPTIONS=--openssl-legacy-provider
#npm install --legacy-peer-deps
export NODE_OPTIONS=--openssl-legacy-provider
/usr/bin/npm start | awk -v UI_NO=$1 '{printf "dokimion_ui_"UI_NO; print $0}'



