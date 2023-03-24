#/bin/sh

use admin

#db.createUser({user:"mongodb-admin",pwd:"password",roles:["clusterAdmin","readWriteAnyDatabase","dbAdminAnyDatabase","userAdminAnyDatabase"]})

db.createUser(
{
  user: "UserAdmin",
  pwd: "password",
  roles: [{ role: "userAdminAnyDatabase", db: "admin" }]
}
)

db.auth("UserAdmin", "password")


