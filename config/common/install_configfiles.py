#
#  Install Config Files in the Ubuntu file system
#  with those same files stored in the git repository
#
import sys
import os
import platform
import shutil

VM_dokimion_configFiles = [
   [ "dokimion/config/production/dokimion"               ],
   [ "nginx.conf",            "/etc/nginx/"              ],
   [ "nginx.service",         "/etc/systemd/system/multi-user.target.wants" ],
   [ "load_balancer.conf",    "/etc/nginx/sites-available" ],
   [ "rsyslog.conf",          "/etc"                     ],
   [ "rsyslog.service",       "/etc/systemd/system/multi-user.target.wants" ]
]

VM_dokimion1_configFiles = [
   [ "dokimion/config/production/dokimion1"                 ],
   [ "25-dokimion.conf",         "/etc/rsyslog.d"           ],
   [ "mongod1.conf",             "/etc"                     ],
   [ "mongod1.service",          "/etc/systemd/system"      ],
   [ "quack.properties",         "/etc/dokimion"            ],
   [ "dokimion1.conf",           "/etc/nginx/sites-available" ],
   [ "dokimion1_server.service", "/etc/systemd/system"      ],
   [ "dokimion1_ui.service",     "/etc/systemd/system"      ],
   [ "rsyslog.conf",             "/etc"                     ],
   [ "rsyslog.service",          "/etc/systemd/system/multi-user.target.wants" ],
   [ "nginx.conf",               "/etc/nginx/"              ],
   [ "nginx.service",            "/etc/systemd/system/multi-user.target.wants" ]
]

VM_dokimion2_configFiles = [
   [ "dokimion/config/production/dokimion2"                 ],
   [ "25-dokimion.conf",         "/etc/rsyslog.d"           ],
   [ "dokimion2.conf",           "/etc"                     ],
   [ "dokimion2.service",        "/etc/systemd/system"      ],
   [ "quack.properties",         "/etc/dokimion"            ],
   [ "dokimion2.conf",           "/etc/nginx/sites-available" ],
   [ "dokimion2_server.service", "/etc/systemd/system"      ],
   [ "dokimion2_ui.service",     "/etc/systemd/system"      ],
   [ "rsyslog.conf",             "/etc"                     ],
   [ "rsyslog.service",          "/etc/systemd/system/multi-user.target.wants" ],
   [ "nginx.conf",               "/etc/nginx/"              ],
   [ "nginx.service",            "/etc/systemd/system/multi-user.target.wants" ]
]

VM_dokimion3_configFiles = [
   [ "dokimion/config/production/dokimion3"                 ],
   [ "25-dokimion3.conf",        "/etc/rsyslog.d"           ],
   [ "mongod3.conf",             "/etc"                     ],
   [ "mongod3.service",          "/etc/systemd/system"      ],
   [ "quack.properties",         "/etc/dokimion"            ],
   [ "dokimion3.conf",           "/etc/nginx/sites-available" ],
   [ "dokimion3_server.service", "/etc/systemd/system"      ],
   [ "dokimion3_ui.service",     "/etc/systemd/system"      ],
   [ "rsyslog.conf",             "/etc"                     ],
   [ "rsyslog.service",          "/etc/systemd/system/multi-user.target.wants" ],
   [ "nginx.conf",               "/etc/nginx/"              ],
   [ "nginx.service",            "/etc/systemd/system/multi-user.target.wants" ]
]

VM_dokimion4_configFiles = [
   [ "dokimion/config/production/dokimion4"                 ],
   [ "25-dokimion4.conf",        "/etc/rsyslog.d"           ],
   [ "mongod4.conf",             "/etc"                     ],
   [ "mongod4.service",          "/etc/systemd/system"      ],
   [ "quack.properties",         "/etc/dokimion"            ],
   [ "dokimion4.conf",           "/etc/nginx/sites-available" ],
   [ "dokimion4_server.service", "/etc/systemd/system"      ],
   [ "dokimion4_ui.service",     "/etc/systemd/system"      ],
   [ "rsyslog.conf",             "/etc"                     ],
   [ "rsyslog.service",          "/etc/systemd/system/multi-user.target.wants" ],
   [ "nginx.conf",               "/etc/nginx/"              ],
   [ "nginx.service",            "/etc/systemd/system/multi-user.target.wants" ]
]

#  dokimion_common.conf is stored ONCE in the repo, under dokimion1, and is shared
#  verbatim by all six web servers -- production dokimion{1,2,3} and staging
#  s-dokimion{1,2,3}.  Its source directory is dokimion1's regardless of the host
#  we are running on, so it cannot live in the per-host tables above.
VM_webserver_sharedConfigFiles = [
   [ "dokimion/config/production/dokimion1"                 ],
   [ "dokimion_common.conf",     "/etc/nginx/sites-available" ]
]

webserverHostnames = [ "dokimion1",   "dokimion2",   "dokimion3",
                       "s-dokimion1", "s-dokimion2", "s-dokimion3" ]

VM_dokimiondev_configFiles = [
   [ "dokimion/config/development/laptop_VM"                   ],
   [ "25-dokimion_dev.conf",        "/etc/rsyslog.d"           ],
   [ "mongod_dev.conf",             "/etc"                     ],
   [ "mongod_dev.service",          "/etc/systemd/system"      ],
   [ "quack.properties",            "/etc/dokimion"            ],
   [ "dokimion_dev.conf",           "/etc/nginx/sites-available" ],
   [ "dokimion_server_dev.service", "/etc/systemd/system"      ],
   [ "dokimion_ui_dev.service",     "/etc/systemd/system"      ],
   [ "rsyslog.conf",                "/etc"                     ],
   [ "rsyslog.service",             "/etc/systemd/system/multi-user.target.wants" ],
   [ "nginx.conf",                  "/etc/nginx/"              ],
   [ "nginx.service",               "/etc/systemd/system/multi-user.target.wants" ]
]

def main():
    rootDir = "~/"

    homeDir = sys.argv[1];
    hostname = platform.node()

    # diff the config file shared by all six web servers (one repo copy, six hosts)
    if hostname in webserverHostnames:
       midDir = VM_webserver_sharedConfigFiles[0][0]

       for configFile, destDir in VM_webserver_sharedConfigFiles[1:]:
           print( "\'diff " + configFile + "\'" );
           print("----------------------------");
           os.system("/usr/bin/diff " + os.path.join( rootDir, midDir, configFile ) + " " +  destDir );

    # diff dokimion files
    if "dokimion" == hostname:
       midDir = VM_dokimion_configFiles[0][0]

       for i in range(len(VM_dokimion_configFiles)-1):
           if i == 0: continue
           configFile = VM_dokimion_configFiles[i][0]
           destDir = VM_dokimion_configFiles[i][1]
           print( "\'diff " + configFile + "\'" );
           print("----------------------------");
           os.system("/usr/bin/diff " + os.path.join( rootDir, midDir, configFile ) + " " +  destDir );

    # diff dokimion1 files
    elif "dokimion1" == hostname:
       midDir = VM_dokimion1_configFiles[0][0]

       for i in range(len(VM_dokimion1_configFiles)-1):
           if i == 0: continue
           configFile = VM_dokimion1_configFiles[i][0]
           destDir = VM_dokimion1_configFiles[i][1]
           print( "\'diff " + configFile + "\'" );
           print("----------------------------");
           os.system("/usr/bin/diff " + os.path.join( rootDir, midDir, configFile ) + " " +  destDir );

    # diff dokimion2 files
    elif "dokimion2" == hostname:
       midDir = VM_dokimion2_configFiles[0][0]

       for i in range(len(VM_dokimion2_configFiles)-1):
           if i == 0: continue
           configFile = VM_dokimion2_configFiles[i][0]
           destDir = VM_dokimion2_configFiles[i][1]
           print( "\'diff " + configFile + "\'" );
           print("----------------------------");
           os.system("/usr/bin/diff " + os.path.join( rootDir, midDir, configFile ) + " " +  destDir );

    # diff dokimion3 files
    elif "dokimion3" == hostname:
       midDir = VM_dokimion3_configFiles[0][0]

       for i in range(len(VM_dokimion3_configFiles)-1):
           if i == 0: continue
           configFile = VM_dokimion3_configFiles[i][0]
           destDir = VM_dokimion3_configFiles[i][1]
           print( "\'diff " + configFile + "\'" );
           print("----------------------------");
           os.system("/usr/bin/diff " + os.path.join( rootDir, midDir, configFile ) + " " +  destDir );

    # diff dokimion4 files
    elif "dokimion4" == hostname:
       midDir = VM_dokimion4_configFiles[0][0]

       for i in range(len(VM_dokimion4_configFiles)-1):
           if i == 0: continue
           configFile = VM_dokimion4_configFiles[i][0]
           destDir = VM_dokimion4_configFiles[i][1]
           print( "\'diff " + configFile + "\'" );
           print("----------------------------");
           os.system("/usr/bin/diff " + os.path.join( rootDir, midDir, configFile ) + " " +  destDir );


    # diff dokimion_dev (laptop VM) files
    elif "dokimiondev" == hostname:
       midDir = VM_dokimiondev_configFiles[0][0]

       for i in range(len(VM_dokimiondev_configFiles)-1):
           if i == 0: continue
           configFile = VM_dokimiondev_configFiles[i][0]
           destDir = VM_dokimiondev_configFiles[i][1]
           if os.path.exists(destDir) == False:
              os.mkdir(destDir);
           shutil.copyfile( os.path.join( homeDir, midDir, configFile ), os.path.join( destDir, configFile ) );
           if "sites-available" in destDir:
              srcPathname = os.path.join( destDir, configFile );
              destDir = destDir.replace("sites-available", "sites-enabled");
              if os.path.exists(destDir) == False:
                 os.mkdir(destDir);
              try:
                 os.symlink( srcPathname, os.path.join(destDir, configFile) );
              except FileExistsError:
                 pass;


    # the staging web servers have no per-host table yet -- the shared file above is
    # all they need, so do not report them as unsupported
    elif hostname not in webserverHostnames:
       print("Non-supported hostname: " + hostname);

    return


if __name__ == "__main__":
    main()

