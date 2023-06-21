#!/bin/sh

# $1 - UI_NO

cd /usr/local/src/quack/ui/src
export NODE_OPTIONS=--openssl-legacy-provider
#npm install --legacy-peer-deps
npm start | awk -v UI_NO=$1 '{printf "quack_ui_"UI_NO; print $0}' | logger -p user.info



