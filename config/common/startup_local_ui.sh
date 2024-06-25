#!/bin/sh

# $1 - UI_NO

cd /home/bob/dokimion/ui/src
export NODE_OPTIONS=--openssl-legacy-provider
#npm install --legacy-peer-deps
npm start | awk -v UI_NO=$1 '{printf "dokimion_ui_"UI_NO; print $0}' | logger -p user.info



