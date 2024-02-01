//
// create and populate TestCaseSizes collection
//
db = db.getSiblingDB('dokimion')

db.DefaultProjectAttributes.drop()
db.DefaultProjectAttributes.insertOne(
{
  "project": "paratext",
  "attributes": [ "Full Regression", "Manual", "All" ]
});


