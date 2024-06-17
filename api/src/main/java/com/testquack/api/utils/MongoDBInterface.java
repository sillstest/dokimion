package com.testquack.api.utils;

import com.testquack.dal.aes;
import com.testquack.dal.Logger;
import com.mongodb.client.MongoCollection;
import com.mongodb.MongoClientSettings;
import com.mongodb.MongoCredential;
import com.mongodb.client.MongoDatabase;
import com.mongodb.client.MongoClient;
import com.mongodb.client.MongoClients;
import com.mongodb.ServerAddress;
import com.mongodb.client.result.UpdateResult;
import org.bson.Document;
import org.bson.conversions.Bson;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import static com.mongodb.internal.connection.ServerAddressHelper.createServerAddress;

import org.json.JSONObject;
import org.json.JSONException;
import org.json.JSONArray;
import org.json.simple.parser.*;

import java.net.InetAddress;
import java.io.FileReader;
import java.io.IOException;
import java.io.Reader;
import java.io.File;
import java.io.FileNotFoundException;
import java.util.List;
import java.util.Arrays;
import java.util.ArrayList;
import java.util.Collection;
import java.util.stream.Collectors;
import java.util.stream.Stream;
import java.util.concurrent.TimeUnit;
import java.util.Scanner;


@Configuration
public class MongoDBInterface  {

   String mongoReplicaSet;
   String mongoUsername;
   String mongoPassword;
   String mongoDBname;

   public void setMongoDBProperties(String replicaSet,
                                    String username,
                                    String password,
                                    String dbname)
   {
      mongoReplicaSet = replicaSet;
      mongoUsername = username;
      mongoPassword = password;
      mongoDBname = dbname;
Logger.info("setMongoDBProperties - replicaSet: " + replicaSet);
Logger.info("setMongoDBProperties - username: " + username);
Logger.info("setMongoDBProperties - dbname: " + dbname);

   }

   public MongoClient getMongoClient()
   {

      List<ServerAddress> addresses = Stream.of(mongoReplicaSet.split(",")).
		          map(String::trim).
	                  map(host-> {
                              String[] tokens = host.split(":");
                              return tokens.length == 2 ?
				      createServerAddress(tokens[0], Integer.parseInt(tokens[1])) :
				      createServerAddress(host);
			  }).
	                  collect(Collectors.toList());

      if (mongoUsername == null || mongoUsername.isEmpty()) {

         Logger.info("MongoDBInterface - mongoUsername = null");

         MongoClientSettings.Builder settingsBuilder = MongoClientSettings.builder()
		 .applyToClusterSettings(builder ->
				 builder.hosts(new ArrayList<>(addresses))
		 )
		 .applyToConnectionPoolSettings(builder -> 
				 builder.minSize(10)
				 .maxSize(100)
				 .maxWaitTime(8, TimeUnit.MINUTES)
		);
         return MongoClients.create(settingsBuilder.build());

      } else {

         final String secretKey = "al;jf;lda1_+_!!()!!!!";
         String decryptedPasswd = aes.decrypt(mongoPassword, secretKey) ;

         Logger.info("MongoDBInterface - decryptedPasswd: " + decryptedPasswd);

         MongoCredential credential = MongoCredential.createCredential(mongoUsername, "admin",
                                   decryptedPasswd.toCharArray());

         MongoClientSettings.Builder settingsBuilder = MongoClientSettings.builder()
		 .applyToClusterSettings(builder ->
				 builder.hosts(new ArrayList<>(addresses))
		 )
                 .credential(credential)
		 .applyToConnectionPoolSettings(builder -> 
				 builder.minSize(10)
				 .maxSize(100)
				 .maxWaitTime(8, TimeUnit.MINUTES)
		);
         return MongoClients.create(settingsBuilder.build());

      }


   }

   public String getEmail(String loginToFind)
   {
      Logger.info("MongoDBInterface getEmail");

      return getUserCollectionAttribute(loginToFind, "email");
   }

   public String getRole(String loginToFind)
   {
      Logger.info("MongoDBInterface getRole");

      return getUserCollectionAttribute(loginToFind, "role");
   }

   public boolean get3LevelCollectionAttributeValue(String collectionName, String attributeName1ToSearch, String attributeName2ToSearch)
   {

      Logger.info("MongoDBInterface::get3LevelCollectionAttributeValue - collectionName: " + collectionName);
      Logger.info("MongoDBInterface::get3LevelCollectionAttributeValue - attributeName1ToSearch: " + attributeName1ToSearch);
      Logger.info("MongoDBInterface::get3LevelCollectionAttributeValue - attributeName2ToSearch: " + attributeName2ToSearch);

      MongoClient mongoClient = getMongoClient();
      MongoDatabase db = mongoClient.getDatabase(mongoDBname);

      MongoCollection<Document> collection = db.getCollection(collectionName);
      String attributeValue ="";

      Logger.info("MongoDBInterface::get3LevelCollectionAttributeValue  - after parser call: collection: " + collection);

      for (Document doc : collection.find())
      {
	 String jsonStr = doc.toJson();

         JSONObject jsonObj = new JSONObject(jsonStr);

         Logger.info("MongoDBInterface::get3LevelCollectionAttributeValue - for loop after toJson, jsonStr: " + jsonStr);

         JSONObject idObj = jsonObj.getJSONObject("_id");
         Logger.info("MongoDBInterface::get3LevelCollectionAttributeValue - idObj: " + idObj);

	 String launchId = idObj.getString("$oid");
         Logger.info("MongoDBInterface::get3LevelCollectionAttributeValue - launchId: " + launchId);

	 if (launchId.equals(attributeName1ToSearch)) {

            Logger.info("MongoDBInterface::get3LevelCollectionAttributeValue - launchId = attributeName1ToSearch");

	    if (attributeName2ToSearch == "") return true;

            JSONObject testCaseTreeObj = jsonObj.getJSONObject("testCaseTree");

            Logger.info("MongoDBInterface::get3LevelCollectionAttributeValue - testCaseTree: " + testCaseTreeObj);

            JSONArray childrenArrayObj = testCaseTreeObj.getJSONArray("children");
            Logger.info("MongoDBInterface::get3LevelCollectionAttributeValue - children: " + childrenArrayObj);

            for (int i = 0; i < childrenArrayObj.length(); i++) {

	       JSONObject childrenObj = childrenArrayObj.getJSONObject(i);
	       JSONArray testCasesArrayObj = childrenObj.getJSONArray("testCases");

               Logger.info("MongoDBInterface::get3LevelCollectionAttributeValue - testCasesArrayObj: " + 
			    testCasesArrayObj);

	       for (int j = 0; j < testCasesArrayObj.length(); j++) {

	          JSONObject testCasesObj = testCasesArrayObj.getJSONObject(j);

	          String uuid = testCasesObj.getString("uuid");
                  Logger.info("MongoDBInterface::get3LevelCollectionAttributeValue - uuid: " + uuid);

                 if (uuid.equals(attributeName2ToSearch))
                    return true;
               }
	    }
	break;
        }
      }
      mongoClient.close();


      return false;
   }
   

   public boolean getCollectionAttributeValue(String collectionName, String attribute1NameToSearch, String attribute1ValueToSearch, String attribute2NameToSearch, String attribute2ValueToSearch)
   {

      Logger.info("MongoDBInterface::getCollectionAttributeValue - collectionName, attributeNames ToSearch: " + collectionName + ", " + attribute1NameToSearch + ", " + attribute2NameToSearch);
      Logger.info("MongoDBInterface::getCollectionAttributeValue - attributeValues ToSearch: " + attribute1ValueToSearch + ", " + attribute2ValueToSearch);

      MongoClient mongoClient = getMongoClient();
      MongoDatabase db = mongoClient.getDatabase(mongoDBname);

      MongoCollection<Document> collection = db.getCollection(collectionName);
      String attributeValue ="";

      JSONParser parser = new JSONParser();

      Logger.info("MongoDBInterface::getCollectionAttributeValue  - after parser call: collection: " + collection);


      for (Document doc : collection.find())
      {
         String jsonStr = doc.toJson();

         Logger.info("MongoDBInterface::getCollectionAttributeValue - for loop after toJson, jsonStr: " + jsonStr);

         JSONObject jsonObj = new JSONObject(jsonStr);

         String attributeValue_1="";
         boolean attr1ValueFoundFlag = false;
         if (attribute1NameToSearch.equals("attachments")) {
Logger.info("MongoDBInterface::getCollectionAttributeValue  - attachments 1 found");
Logger.info("1 jsonObj.get(attribute1NameToSearch): " + jsonObj.get(attribute1NameToSearch));

            JSONArray ary = jsonObj.getJSONArray(attribute1NameToSearch);
            for (int i = 0; i < ary.length(); i++) {
               JSONObject aryObj = ary.getJSONObject(i);
               String id = aryObj.getString("_id");
Logger.info("MongoDBInterface::getCollectionAttributeValue  - 1 JSON array loop: " + id);
               if (id.equals(attribute1ValueToSearch)) {
Logger.info("MongoDBInterface::getCollectionAttributeValue  - 1 attr1ValueFoundFlag = true");
                  attr1ValueFoundFlag = true;
                  break;
               }
           }
         } else {
           attributeValue_1 = (String)jsonObj.get(attribute1NameToSearch);
         }

         String attributeValue_2="";
         boolean attr2ValueFoundFlag = false;
         if (attribute2NameToSearch.equals("attachments")) {
Logger.info("MongoDBInterface::getCollectionAttributeValue  - attachments 2 found");
Logger.info("1 jsonObj.get(attribute2NameToSearch): " + jsonObj.get(attribute2NameToSearch));
            JSONArray ary = jsonObj.getJSONArray(attribute2NameToSearch);
            for (int i = 0; i < ary.length(); i++) {
                JSONObject aryObj = ary.getJSONObject(i);
                String id = aryObj.getString("_id");
Logger.info("MongoDBInterface::getCollectionAttributeValue  - 2 JSON array loop: " + id);
                if (id.equals(attribute2ValueToSearch)) {
Logger.info("MongoDBInterface::getCollectionAttributeValue  - 2 attr1ValueFoundFlag = true");
                   attr2ValueFoundFlag = true;
                }
            }
         } else {
	    attributeValue_2 = (String)jsonObj.get(attribute2NameToSearch);
         }

         Logger.info("MongoDBInterface::getCollectionAttributeValue - bottom of for loop, atttributeValue_1, attributeValue_2: " + attributeValue_1 + ", " + attributeValue_2);

         if ((attr1ValueFoundFlag == true || 
              attribute1ValueToSearch.equals(attributeValue_1)) &&
             (attr2ValueFoundFlag == true || 
              attribute2ValueToSearch.equals(attributeValue_2))) {
            return true;
         }


      }

      mongoClient.close();
      return false;

   }


   public boolean getCollectionAttributeValue(String collectionName, String attributeNameToSearch, String attributeValueToSearch)
   {

      Logger.info("MongoDBInterface::getCollectionAttributeValue - collectionName, attributeNameToSearch: " + collectionName + ", " + attributeNameToSearch);

      MongoClient mongoClient = getMongoClient();
      MongoDatabase db = mongoClient.getDatabase(mongoDBname);

      MongoCollection<Document> collection = db.getCollection(collectionName);
      String attributeValue ="";

      JSONParser parser = new JSONParser();

      Logger.info("MongoDBInterface::getCollectionAttributeValue  - after parser call: collection: " + collection);


      for (Document doc : collection.find())
      {
         String jsonStr = doc.toJson();

         Logger.info("MongoDBInterface::getCollectionAttributeValue - for loop after toJson, jsonStr: " + jsonStr);

	 Object obj = null;
	 try {
	   obj = parser.parse(jsonStr);
	 } catch (ParseException e) {
           Logger.info("MongoDBInterface::getCollectionAttributeValue  - ParseException - jsonStr: " + jsonStr);
	 }

	 org.json.simple.JSONObject jsonObj = (org.json.simple.JSONObject)obj;

         Logger.info("MongoDBInterface::getCollectionAttributeValue  - jsonObj: " + jsonObj);
         
	 attributeValue = (String)jsonObj.get(attributeNameToSearch);

         Logger.info("MongoDBInterface::getCollectionAttributeValue - 1 bottom of for loop, atttributeValue: " + attributeValue);

         if (attributeValueToSearch.equals(attributeValue)) {
            return true;
         }

      }

      mongoClient.close();
      return false;
   }

   private String getUserCollectionAttribute(String loginToFind, String userAttribute)
   {
      MongoClient mongoClient = getMongoClient();
      MongoDatabase db = mongoClient.getDatabase(mongoDBname);

      MongoCollection<Document> collection = db.getCollection("users");

      JSONParser parser = new JSONParser();

      for (Document doc : collection.find())
      {
	 String jsonStr = doc.toJson();

	 Object obj = null;
	 try {
	    obj = parser.parse(jsonStr);
	 } catch (ParseException e) {
            Logger.info("ParseException - jsonStr: " + jsonStr);
	 }

	 org.json.simple.JSONObject jsonObj = (org.json.simple.JSONObject)obj;

	 String login = (String)jsonObj.get("login");
	 String email = (String)jsonObj.get("email");
	 String role = (String)jsonObj.get("role");

	 Logger.info("login: " + login);
	 Logger.info("email: " + email);

	 if (login.equals(loginToFind))
         {
	    Logger.info("email found: " + email);
            if (userAttribute == "email")
            {
	       return email;
            } else {
               return role;
            }
	 }

      }

      mongoClient.close();

      return "";
   }

   public void updatePassword(String loginToFind, String password)
   {


      try {

         Logger.info("MongoDBInterface updatePassword");

	 MongoClient mongoClient = getMongoClient();
	 MongoDatabase db = mongoClient.getDatabase(mongoDBname);

	 updateOne(loginToFind, password, db);

         mongoClient.close();

      } catch (Exception ex) {
         ex.printStackTrace();
      }
   }

   public void updateOne(String loginToFind, String password, MongoDatabase db )
   {

         MongoCollection<Document> collection = db.getCollection("users");

	 Logger.info("after db getCollection");

	 Document query = new Document("login", loginToFind);

	 Logger.info("after new doc login");

	 Document content = new Document();
	 content.append("password", password);
	 content.append("passwordChangeRequired", true);

	 Document updates = new Document("$set", content);

	 Logger.info("after new doc updates");

	 UpdateResult result = collection.updateMany(query, updates);
	 Logger.info("after updateMany - modified count: " + result.getModifiedCount());

   }


}
