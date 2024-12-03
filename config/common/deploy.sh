#!/bin/bash -x
# assume in quack repo - root dir
#
#  $1 - server optional prefix ('s') and number (1, 2, or 3)
#  $2 - prod or test
#
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
cp ~1/tools/AdminPassword.java .
cp ~1/tools/TestcaseSizes.java .
cp ~1/tools/User.java .
cp ~1/tools/ConfigurationAttributes.java .
cp ~1/tools/DefaultProjectAttributes.java .
cp ~1/tools/mongodb_RoleCapability_init.js .
cp ~1/tools/mongodb_User_init.js .
cp ~1/tools/mongodb_TestcaseSizes_init.js .
cp ~1/tools/mongodb_User_init.js .
cp ~1/tools/mongodb_DefaultProjectAttributes_init.js .
cp ~1/tools/mongodb_ConfigurationAttributes_init.js .
tar xvzf ui.tgz
if [ $1 == "1" ]
then
  cp ~1/config/production/dokimion1/startup_dokimion_server.sh ../bin/.
fi
if [ $1 == "2" ]
then
  cp ~1/config/production/dokimion2/startup_dokimion_server.sh ../bin/.
fi
if [ $1 == "3" ]
then
  cp ~1/config/production/dokimion3/startup_dokimion_server.sh ../bin/.
fi
if [ $1 == "s1" ]
then
  cp ~1/config/production/s-dokimion1/startup_dokimion_server.sh ../bin/.
fi
if [ $1 == "s2" ]
then
  cp ~1/config/production/s-dokimion2/startup_dokimion_server.sh ../bin/.
fi
if [ $1 == "s3" ]
then
  cp ~1/config/production/s-dokimion3/startup_dokimion_server.sh ../bin/.
fi
cp ~1/config/common/startup_dokimion_ui.sh ../bin/.
cp ~1/config/common/run_jstatd.sh ../bin/.
if [ $2 == "prod" ]
then
  cp ~1/config/common/.env_prod src/.env
else
  cp ~1/config/common/.env_test src/.env
fi
chown dokimion:dokimion .
chown dokimion:dokimion -R *
chmod -R a+w *
chmod -R a+w .
cd src
cp -r node_modules/tinymce* public/.

# restart relevant system services
if [ $1 == "_dev" ]
then
   systemctl restart dokimion_server$1.service
   systemctl restart dokimion_ui$1.service
   systemctl status dokimion_server$1.service
   systemctl status dokimion_ui$1.service
elif [ $1 == "s1" ]
then
   systemctl restart dokimion1_server.service
   systemctl restart dokimion1_ui.service
   systemctl status dokimion1_server.service
   systemctl status dokimion1_ui.service
elif [ $1 == "s2" ]
then
   systemctl restart dokimion2_server.service
   systemctl restart dokimion2_ui.service
   systemctl status dokimion2_server.service
   systemctl status dokimion2_ui.service
elif [ $1 == "s3" ]
then
   systemctl restart dokimion3_server.service
   systemctl restart dokimion3_ui.service
   systemctl status dokimion3_server.service
   systemctl status dokimion3_ui.service
else
   systemctl restart dokimion$1_server.service
   systemctl restart dokimion$1_ui.service
   systemctl status dokimion$1_server.service
   systemctl status dokimion$1_ui.service
fi
