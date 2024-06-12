#!/bin/bash

# $1 - SERVER_NO

cd /home/bob/dokimion

/usr/bin/java -Dmail.debug=true -Xbootclasspath/a:/etc/dokimion -jar /home/bob/dokimion/assembly/target/lib/jetty-runner.jar /home/bob/dokimion/assembly/target/quack.war 


