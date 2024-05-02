#
#  Parse the dokimion server log and print a report consisting
#  of the following columns: date, login, elapsed time of login, start time, end time

# May  2 13:10:26 dokimion4 dokimion: dokimion_server_4UserResource::logout - login: bob_beck@sil.org

import sys
import re
import codecs

if (len(sys.argv) != 2):
    print("Unsupported number of arguments");
    sys.exit(-1);

fileName = sys.argv[1];

with codecs.open(fileName, 'r', encoding='utf-8', errors='ignore') as fd:
   lines = fd.readlines();

parsedData = {};

for line in lines:

    tokens = line.split();

    month = tokens[0];
    day = tokens[1];
    time = tokens[2];

    newLine = ''.join(tokens[3:]);

    loginMatch = "login-login:";
    if loginMatch in newLine:

       p = re.compile(loginMatch + '\S+');
       m = p.search(newLine);

       if m:
           found = m.group(0);

           login = found[len(loginMatch) :];

           if parsedData.get(login):
              list_of_lists = parsedData[login];
           else:
              list_of_lists = [];
           list_of_lists.append(["login", month, day, time ]);
           parsedData[login] = list_of_lists;

           continue;

    logoutMatch = "logout-login:";
    if logoutMatch in newLine:

       p = re.compile(logoutMatch + '\S+');
       m = p.search(newLine);

       if m:
           found = m.group(0);

           logout = found[len(logoutMatch) :];

           if parsedData.get(logout):
              list_of_lists = parsedData[logout];
           else:
              list_of_lists = [];
           list_of_lists.append(["logout", month, day, time ]);
           parsedData[logout] = list_of_lists;

           continue;



print(parsedData);



