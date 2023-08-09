#!/bin/sh

export NODE_OPTIONS=--openssl-legacy-provider
mvn clean install -DskipTests

# add "react-scripts --openssl-legacy-provider build/start to
# package.json in quack/ui/src

