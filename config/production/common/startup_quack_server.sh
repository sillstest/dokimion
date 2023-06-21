#!/bin/sh

# $1 - SERVER_NO


/usr/bin/java -Dmail.debug=true -Xbootclasspath/a:/etc/quack -jar /home/quack/quack/jetty-runner.jar /home/quack/quack/quack.war | awk -v SERVER_NO=$1 '{printf "quack_server_" SERVER_NO; print $0}' | logger -p user.info



