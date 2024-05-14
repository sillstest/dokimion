
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


        return mongoDBInterface.getCollectionAttributeValue("projects", "_id", projectId);

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

        return mongoDBInterface.getCollectionAttributeValue(projectId + "_TestCase", "_id", testcaseId);

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

        return mongoDBInterface.getCollectionAttributeValue(projectId + "_TestCase", "_id", testcaseId, "attachments", attachmentId);

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

        return mongoDBInterface.get3LevelCollectionAttributeValue(projectId + "_Launch", launchId, "");

    }

    static public boolean checkLaunchIdNTestCaseUUID(String replicaSet,
        String username,
        String password,
        String dbname,
        String projectId,
        String launchId,
        String launchTestCaseUUID) {

System.out.println("APIValidation::checkLaunchIdNTestCaseUUID - projectId: " + projectId);
System.out.println("APIValidation::checkLaunchIdNTestCaseUUID - launchId: " + launchId);
System.out.println("APIValidation::checkLaunchIdNTestCaseUUID - launchTestCaseUUID: " + launchTestCaseUUID);
System.out.flush();

        MongoDBInterface mongoDBInterface = new MongoDBInterface();
        mongoDBInterface.setMongoDBProperties(replicaSet,
                username,
                password,
                dbname);

        return mongoDBInterface.get3LevelCollectionAttributeValue(projectId + "_Launch", launchId, launchTestCaseUUID);

    }

    static public boolean checkLoginId(String replicaSet,
        String username,
        String password,
        String dbname,
        String loginId) {

System.out.println("APIValidation::checkLoginId - loginId: " + loginId);
System.out.flush();

	if (loginId.toLowerCase().equals("admin")) {
	   return true;
	}

        MongoDBInterface mongoDBInterface = new MongoDBInterface();
        mongoDBInterface.setMongoDBProperties(replicaSet,
                username,
                password,
                dbname);


        return mongoDBInterface.getCollectionAttributeValue("users", "login", loginId);

    }

}
