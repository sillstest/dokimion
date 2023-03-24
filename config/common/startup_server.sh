#!/bin/sh

sudo systemctl status mongod
sudo systemctl status nginx

mongod_startup.sh

cd ~bob/testautomation/quack

java -Xbootclasspath/a:/etc/quack -jar assembly/target/lib/jetty-runner.jar assembly/target/quack.war



