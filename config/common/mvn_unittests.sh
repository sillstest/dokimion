#!/bin/sh

export NODE_OPTIONS=--openssl-legacy-provider
export PATH=/opt/apache-maven-3.6.3/bin:$PATH
export PATH=/opt/apache-maven/bin:$PATH
mvn clean install

# add "react-scripts --openssl-legacy-provider build/start to
# package.json in quack/ui/src

