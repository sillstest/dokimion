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

dataByLogin = {};
dataByDate = {};

for line in lines:

    tokens = line.split();

    month = tokens[0];
    day = tokens[1];
    time = tokens[2];

    date = month + day;
    newLine = ''.join(tokens[3:]);

    loginMatch = "login-login:";
    if loginMatch in newLine:

       p = re.compile(loginMatch + '\S+');
       m = p.search(newLine);

       if m:
           found = m.group(0);

           login = found[len(loginMatch) :];

           if dataByLogin.get(login):
              list_of_lists = dataByLogin[login];
           else:
              list_of_lists = [];
           list_of_lists.append(["login", month, day, time ]);
           dataByLogin[login] = list_of_lists;

           if dataByDate.get(date):
              list_of_lists = dataByDate[date];
           else:
              list_of_lists = [];
           list_of_lists.append(["login", login, time]);
           dataByDate[date] = list_of_lists;

           continue;

    logoutMatch = "logout-login:";
    if logoutMatch in newLine:

       p = re.compile(logoutMatch + '\S+');
       m = p.search(newLine);

       if m:
           found = m.group(0);

           logout = found[len(logoutMatch) :];

           if dataByLogin.get(logout):
              list_of_lists = dataByLogin[logout];
           else:
              list_of_lists = [];
           list_of_lists.append(["logout", month, day, time ]);
           dataByLogin[logout] = list_of_lists;

           if dataByDate.get(date):
              list_of_lists = dataByDate[date];
           else:
              list_of_lists = [];
           list_of_lists.append(["logout", logout, time]);
           dataByDate[date] = list_of_lists;

           continue;


print("Data by Login");
print(dataByLogin);

logins = {};
logouts = {};

for login in dataByLogin.keys():
    if dataByLogin[login][0][0] == "login":
       if logins.get(login):
          logins[login] += 1;
       else:
          logins[login] = 1;
    if dataByLogin[login][0][0] == "logout":
       if logouts.get(login):
          logouts[login] += 1;
       else:
          logouts[login] = 1;

print("LOGINS");
print(logins);
print("LOGOUTS");
print(logouts);



print("Data by Date");
print(dataByDate);


logins = {};
logouts = {};

#{'Apr24': [['login', 'bob_beck@sil.org', '20:56:20'], ['login', 'admin', '20:59:13'], ['login', 'Tester', '20:59:48'], ['login', 'Tester', '20:59:50'], ['login', 'Tester', '20:59:53'], ['login', 'Tester', '20:59:56'], ['login', 'Tester', '21:00:02'], ['login', 'Tester

for date in dataByDate.keys():
    for loginLogoutTuple in dataByDate[date]:
        login = loginLogoutTuple[1];
        if loginLogoutTuple[0] == "login":
            if logins.get(date):
                if logins[date].get(login):
                   logins[date][login] += 1;
                else:
                   logins[date][login] = 1;
            else:
               logins[date] = {};
               logins[date][login] = 1;


        if loginLogoutTuple[0] == "logout":
            if logouts.get(date):
                if logouts[date].get(login):
                   logouts[date][login] += 1;
                else:
                   logouts[date][login] = 1;
            else:
               logouts[date] = {};
               logouts[date][login] = 1;





print("LOGINS");
print(logins);
print("LOGOUTS");
print(logouts);

