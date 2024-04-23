
package com.testquack.api.utils;

import static java.lang.String.format;

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
                                              
    static public boolean checkTestCaseId(String replicaSet,
                                          String username,
                                          String password,
                                          String dbname,
                                          String projectId,
                                          String testcaseId) {

        MongoDBInterface mongoDBInterface = new MongoDBInterface();
        mongoDBInterface.setMongoDBProperties(replicaSet,
                                              username,
                                              password,
                                              dbname);

        String attributeValue = mongoDBInterface.getCollectionAttributeValue(projectId + "_TestCase", "_id");

        return testcaseId.equals(attributeValue);

    }
               
                                              
    static public boolean checkAttachmentId(String replicaSet,
                                            String username,
                                            String password,
                                            String dbname,
                                            String projectId,
                                            String testcaseId,
                                            String attachmentId) {

        MongoDBInterface mongoDBInterface = new MongoDBInterface();
        mongoDBInterface.setMongoDBProperties(replicaSet,
                                              username,
                                              password,
                                              dbname);

        String attributeValue = mongoDBInterface.getCollectionAttributeValue(projectId + "_TestCase", "attachments");

        return attachmentId.equals(attributeValue);

    }

    static public boolean checkLaunchId(String replicaSet,
                                        String username,
                                        String password,
                                        String dbname,
                                        String projectId,
                                        String launchId) {

        MongoDBInterface mongoDBInterface = new MongoDBInterface();
        mongoDBInterface.setMongoDBProperties(replicaSet,
                                              username,
                                              password,
                                              dbname);

        String attributeValue = mongoDBInterface.getCollectionAttributeValue(projectId + "_Launch", "_id");

        return launchId.equals(attributeValue);

    }

    static public boolean checkLaunchIdNTestCaseUUID(String replicaSet,
        String username,
        String password,
        String dbname,
        String projectId,
        String launchId,
        String launchTestCaseUUID) {

        MongoDBInterface mongoDBInterface = new MongoDBInterface();
        mongoDBInterface.setMongoDBProperties(replicaSet,
                username,
                password,
                dbname);

        String attributeValue = mongoDBInterface.get3LevelCollectionAttributeValue(projectId + "_Launch", "_id");

        attributeValue = mongoDBInterface.getCollectionAttributeValue(projectId + "_Launch",  "_id");
            
        attributeValue = mongoDBInterface.getCollectionAttributeValue(projectId + "_Launch",  "_id");

        return launchTestCaseUUID.equals(attributeValue);


    }

}
