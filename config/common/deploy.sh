#!/bin/bash -x
# assume in quack repo - root dir

# prepare files for move to /deploy
pushd ui
tar cvzf ui.tgz src/
popd

# move files from /deploy to 
pushd /home/dokimion
rm -rf dokimion
mkdir dokimion
cd dokimion

cp ~1/ui/ui.tgz .
cp ~1/assembly/target/quack.war dokimion.war
cp ~1/assembly/target/lib/jetty-runner.jar .
tar xvzf ui.tgz

# restart relevant system services
if [ $1 != "_dev" ]
then
  systemctl restart dokimion$1_server.service
  systemctl restart dokimion$1_ui.service
  systemctl status dokimion$1_server.service
  systemctl status dokimion$1_ui.service
else
  systemctl restart dokimion_server_dev.service
  systemctl restart dokimion_ui_dev.service
  systemctl status dokimion_server_dev.service
  systemctl status dokimion_ui_dev.service
fi

