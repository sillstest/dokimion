#
#  Diff Config Files in the Ubuntu file system
#  with those same files stored in the git repository
#
import sys
import os
import platform

VM_common_configFiles = [
   [ "quack/config/production/VM_common"                 ],
   [ "rsyslog.conf",          "/etc"                     ],
   [ "rsyslog.service",       "/etc/systemd/system/multi-user.target.wants" ],
   [ "nginx.conf",            "/etc/nginx"               ]
]

VM_quack_configFiles = [
   [ "quack/config/production/VM_quack"                  ],
   [ "load_balancer.conf",    "/etc/nginx/conf.d"        ]
]

VM_quack1_configFiles = [
   [ "quack/config/production/VM_quack1"                 ],
   [ "25-quack.conf",         "/etc/rsyslog.d"           ],
   [ "mongod1.conf",          "/etc"                     ],
   [ "mongod1.service",       "/etc/systemd/system"      ],
   [ "quack.properties",      "/etc/quack"               ],
   [ "quack1.conf",           "/etc/nginx/conf.d"        ],
   [ "quack1_server.service", "/etc/systemd/system"      ],
   [ "quack1_ui.service",     "/etc/systemd/system"      ]
]

VM_quack2_configFiles = [
   [ "quack/config/production/VM_quack2"                 ],
   [ "25-quack.conf",         "/etc/rsyslog.d"           ],
   [ "mongod2.conf",          "/etc"                     ],
   [ "mongod2.service",       "/etc/systemd/system"      ],
   [ "quack.properties",      "/etc/quack"               ],
   [ "quack2.conf",           "/etc/nginx/conf.d"        ],
   [ "quack2_server.service", "/etc/systemd/system"      ],
   [ "quack2_ui.service",     "/etc/systemd/system"      ]
]

VM_quack3_configFiles = [
   [ "quack/config/production/VM_quack3"                 ],
   [ "25-quack.conf",         "/etc/rsyslog.d"           ],
   [ "mongod3.conf",          "/etc"                     ],
   [ "mongod3.service",       "/etc/systemd/system"      ],
   [ "quack.properties",      "/etc/quack"               ],
   [ "quack3.conf",           "/etc/nginx/conf.d"        ],
   [ "quack3_server.service", "/etc/systemd/system"      ],
   [ "quack3_ui.service",     "/etc/systemd/system"      ]
]

def main():
    rootDir = "~/"

    # diff common files
    midDir = VM_common_configFiles[0][0]

    for i in range(len(VM_common_configFiles)-1):
        if i == 0: continue
        configFile = VM_common_configFiles[i][0]
        destDir = VM_common_configFiles[i][1]
        print( "\'diff " + configFile + "\'" );
        print("----------------------------");
        os.system("/usr/bin/diff " + os.path.join( rootDir, midDir, configFile ) + " " +  destDir );

    hostname = platform.node()

    # diff quack files
    if "quack" == hostname:
       midDir = VM_quack_configFiles[0][0]

       for i in range(len(VM_quack_configFiles)-1):
           if i == 0: continue
           configFile = VM_quack_configFiles[i][0]
           destDir = VM_quack_configFiles[i][1]
           print( "\'diff " + configFile + "\'" );
           print("----------------------------");
           os.system("/usr/bin/diff " + os.path.join( rootDir, midDir, configFile ) + " " +  destDir );

    # diff quack1 files
    elif "quack1" == hostname:
       midDir = VM_quack1_configFiles[0][0]

       for i in range(len(VM_quack1_configFiles)-1):
           if i == 0: continue
           configFile = VM_quack1_configFiles[i][0]
           destDir = VM_quack1_configFiles[i][1]
           print( "\'diff " + configFile + "\'" );
           print("----------------------------");
           os.system("/usr/bin/diff " + os.path.join( rootDir, midDir, configFile ) + " " +  destDir );

    # diff quack2 files
    elif "quack2" == hostname:
       midDir = VM_quack2_configFiles[0][0]

       for i in range(len(VM_quack2_configFiles)-1):
           if i == 0: continue
           configFile = VM_quack2_configFiles[i][0]
           destDir = VM_quack2_configFiles[i][1]
           print( "\'diff " + configFile + "\'" );
           print("----------------------------");
           os.system("/usr/bin/diff " + os.path.join( rootDir, midDir, configFile ) + " " +  destDir );

    # diff quack3 files
    elif "quack3" == hostname:
       midDir = VM_quack3_configFiles[0][0]

       for i in range(len(VM_quack3_configFiles)-1):
           if i == 0: continue
           configFile = VM_quack3_configFiles[i][0]
           destDir = VM_quack3_configFiles[i][1]
           print( "\'diff " + configFile + "\'" );
           print("----------------------------");
           os.system("/usr/bin/diff " + os.path.join( rootDir, midDir, configFile ) + " " +  destDir );


    return



if __name__ == "__main__":
    main()

