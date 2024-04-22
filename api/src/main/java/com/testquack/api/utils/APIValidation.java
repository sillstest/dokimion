
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
                                              
    static public boolean checkTestCaseId(String replicaSet,
                                          String username,
                                          String password,
                                          String dbname,
                                          String testcaseId) {

        MongoDBInterface mongoDBInterface = new MongoDBInterface();
        mongoDBInterface.setMongoDBProperties(replicaSet,
                                              username,
                                              password,
                                              dbname);

        String attributeValue = mongoDBInterface.getCollectionAttributeValue("TestCase", "_id");

        return testcaseId.equals(attributeValue);

    }
               
                                              
    static public boolean checkAttachmentId(String replicaSet,
                                            String username,
                                            String password,
                                            String dbname,
                                            String attachmentId) {

        MongoDBInterface mongoDBInterface = new MongoDBInterface();
        mongoDBInterface.setMongoDBProperties(replicaSet,
                                              username,
                                              password,
                                              dbname);

        String attributeValue = mongoDBInterface.getCollectionAttributeValue("TestCase", "attachments");

        return attachmentId.equals(attributeValue);

    }




}
