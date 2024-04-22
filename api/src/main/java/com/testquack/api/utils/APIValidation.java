
package com.testquack.api.utils;

public class APIValidation {
    

    static public boolean checkProjectId(String replicaSet,
                                         String username,
                                         String password,
                                         String dbname,
                                         String projectId) {

        MongoDBInterface mongoDBInterface = new MongoDBInterface();
        mongoDBInterface.setMongoDBProperties(replicaSet,
                                              username,
                                              password,
                                              dbname);


        String attributeValue = mongoDBInterface.getCollectionAttributeValue("projects", "_id");

        return projectId.equals(attributeValue);

    }
                                              






}
