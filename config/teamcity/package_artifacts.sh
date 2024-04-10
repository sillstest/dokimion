#!/bin/bash
<<<<<<< HEAD
pwd
cd ../
=======
cd ../
pwd
>>>>>>> 8aa932da35eccfea332e8b37e78ef027d57bb33b
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
chmod -R a+w *
chmod -R a+w .
cd src
cp -r src/node_modules/tinymce .


