//
// create primary index for each users collection
//
//   load("tools/mongodb_create_indices.js")
//
//
db = db.getSiblingDB('dokimion')

const projectCollectionNames = [ "audioproje", "bloom", "dokimion", "dokimionls", "keyman", 
	                         "paratext", "paratext2", "paratextlite", "sandbox", "silfieldwo",
	                         "thecombine" ];

const projectCollectionFields  = [ ["_Attribute", "name"], ["_Comment", "entityId"], ["_Event", "entityId"], 
                                   ["_Launch", "name"], ["_TestCase", "name"], ["_TestSuite", "name"]  ];


const miscCollectionNames = [ ["users", "login"], ["projects", "name"], ["RoleCapability", "name"], 
	                      ["DefaultProjectAttributes", "project"], ["TestcaseSizes", "name"] ];



for (let i = 0; i < projectCollectionNames.length; i++) {
   for (let j = 0; j < projectCollectionFields.length; j++) {

      let collName = projectCollectionNames[i] + projectCollectionFields[j][0];
      let indexFieldName =  projectCollectionFields[j][1];
      console.log("collName: ", collName);
      console.log("indexFieldName: ", indexFieldName);
      try {
         db.getCollection(collName).createIndex({ [indexFieldName] : 1 });
      }
      catch (e) {
         console.log("Exception: ", e);
      }

    }
}

for (let i = 0; i < miscCollectionNames.length; i++) {

   let collName = miscCollectionNames[i][0];
   let indexFieldName = miscCollectionNames[i][1];
   console.log("collName: ", collName);
   console.log("indexFieldName: ", indexFieldName);

   try {
      db.getCollection(collName).createIndex({ [indexFieldName] : 1} );
   } catch(e) {
      console.log("Exception: ", e);
   }
}





