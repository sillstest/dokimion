//
// create and populate TestCaseSizes collection
//
db = db.getSiblingDB('dokimion')

db.TestcaseSizes.drop()
db.TestcaseSizes.insertOne(
{
  "name": 'small',
  "minLines": 0,
  "maxLines": 25
});
db.TestcaseSizes.insertOne(
{
  "name": 'medium',
  "minLines": 26,
  "maxLines": 100
});
db.TestcaseSizes.insertOne(
{
  "name": 'large',
  "minLines": 101,
  "maxLines": -1
});


