#!/bin/bash
pwd
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
cp ../config/common/startup_dokimion_server.sh .
cp ../config/common/startup_dokimion_ui.sh .
cp -r src/node_modules/tinymce .


