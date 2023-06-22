#!/bin/sh

# $1 - SERVER_NO


/usr/bin/java -Dmail.debug=true -Xbootclasspath/a:/etc/quack -jar /usr/local/src/quack/assembly/target/lib/jetty-runner.jar /usr/local/src/quack/assembly/target/quack.war | awk -v SERVER_NO=$1 '{printf "quack_server_" SERVER_NO; print $0}' | logger -p user.info



