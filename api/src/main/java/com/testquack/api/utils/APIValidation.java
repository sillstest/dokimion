
package com.testquack.api.utils;

import com.testquack.dal.aes;
import com.testquack.dal.Logger;

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

Logger.info("APIValidation::checkLaunchIdNTestCaseUUID - projectId: " + projectId);
Logger.info("APIValidation::checkLaunchIdNTestCaseUUID - launchId: " + launchId);
Logger.info("APIValidation::checkLaunchIdNTestCaseUUID - launchTestCaseUUID: " + launchTestCaseUUID);

return true;
/*-
        MongoDBInterface mongoDBInterface = new MongoDBInterface();
        mongoDBInterface.setMongoDBProperties(replicaSet,
                username,
                password,
                dbname);

        return mongoDBInterface.get3LevelCollectionAttributeValue(projectId + "_Launch", launchId, launchTestCaseUUID);
	*/

    }

    static public boolean checkLoginId(String replicaSet,
        String username,
        String password,
        String dbname,
        String loginId) {

Logger.info("APIValidation::checkLoginId - loginId: " + loginId);

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
