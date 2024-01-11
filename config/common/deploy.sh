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
cp ~1/tools/aes.java .
cp ~1/tools/RoleCapability.java .

tar xvzf ui.tgz

# restart relevant system services
if [ $1 == "_dev" ]
then
   systemctl restart dokimion_server$1.service
   systemctl restart dokimion_ui$1.service
   systemctl status dokimion_server$1.service
   systemctl status dokimion_ui$1.service
else
   systemctl restart dokimion$1_server.service
   systemctl restart dokimion$1_ui.service
   systemctl status dokimion$1_server.service
   systemctl status dokimion$1_ui.service
fi
