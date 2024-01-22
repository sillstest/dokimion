//
// create and populate TestCaseSizes collection
//
db = db.getSiblingDB('dokimion')

db.TestcaseSizes.drop()
db.TestcaseSizes.insertOne(
{
  "name": 'small',
  "minlines": 0,
  "maxlines": 25
});
db.TestcaseSizes.insertOne(
{
  "name": 'medium',
  "minlines": 26,
  "maxlines": 100
});
db.TestcaseSizes.insertOne(
{
  "name": 'large',
  "minlines": 101,
  "maxlines": -1
});


