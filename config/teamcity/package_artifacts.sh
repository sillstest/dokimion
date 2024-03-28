#!/bin/bash
pwd
cd ../
cd ui
pwd
/bin/tar cvzf ui.tgz src/
cp ../tools/aes.java .
cp ../tools/RoleCapability.java .
cp ../tools/AdminPassword.java .
cp ../tools/TestcaseSizes.java .
cp ../tools/DefaultProjectAttributes.java .
cp ../tools/mongodb_RoleCapability_init.js .
cp ../tools/mongodb_TestcaseSizes_init.js .
cp ../tools/mongodb_DefaultProjectAttributes_init.js .
tar xvzf ui.tgz
cp ../config/common/startup_dokimion_server.sh .
cp ../config/common/startup_dokimion_ui.sh .
chmod -R a+w *
chmod -R a+w .
cd src
cp -r node_modules/tinymce* .


