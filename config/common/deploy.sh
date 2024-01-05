#!/bin/bash -x
# assume in quack repo - root dir

pushd ui
tar cvzf ui.tgz src/
popd

# move files 
pushd /home/dokimion
rm -rf dokimion
mkdir dokimion
cd dokimion

cp ~1/ui/ui.tgz .
cp ~1/assembly/target/quack.war dokimion.war
cp ~1/assembly/target/lib/jetty-runner.jar .
tar xvzf ui.tgz

# restart relevant system services
systemctl restart dokimion_server$1.service
systemctl restart dokimion_ui$1.service
systemctl status dokimion_server$1.service
systemctl status dokimion_ui$1.service

