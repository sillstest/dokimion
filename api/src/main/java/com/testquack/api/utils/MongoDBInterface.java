package com.testquack.api.utils;

import com.testquack.dal.aes;

import com.mongodb.client.MongoCollection;
import com.mongodb.MongoClientSettings;
import com.mongodb.MongoCredential;
import com.mongodb.client.MongoDatabase;
import com.mongodb.client.MongoClient;
import com.mongodb.client.MongoClients;
import com.mongodb.ServerAddress;
import com.mongodb.client.result.UpdateResult;
import com.mongodb.client.model.Filters;
import com.mongodb.client.model.Updates;
import org.bson.Document;
import org.bson.conversions.Bson;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import static com.mongodb.internal.connection.ServerAddressHelper.createServerAddress;
import ru.greatbit.whoru.auth.Person;

import org.bson.Document;

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
System.out.println("setMongoDBProperties - replicaSet: " + replicaSet);
System.out.println("setMongoDBProperties - username: " + username);
System.out.println("setMongoDBProperties - dbname: " + dbname);

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

         System.out.println("MongoDBInterface - mongoUsername = null");
         System.out.flush();

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
				 .maxWaitTime(5, TimeUnit.SECONDS)
		);
         return MongoClients.create(settingsBuilder.build());

      }


   }

   public Person getPerson(String loginToFind) {

      MongoClient mongoClient = getMongoClient();
      MongoDatabase db = mongoClient.getDatabase(mongoDBname);

      MongoCollection<Document> collection = db.getCollection("users");

      JSONParser parser = new JSONParser();

      if (collection == null) {
         System.out.println("getUserCollectionAttribute - collection = null");
         System.out.flush();
      }

      for (Document doc : collection.find())
      {
         String jsonStr = doc.toJson();

         Object obj = null;
         try {
            obj = parser.parse(jsonStr);
         } catch (ParseException e) {
            System.out.println("ParseException - jsonStr: " + jsonStr);
         }

         org.json.simple.JSONObject jsonObj = (org.json.simple.JSONObject)obj;

	 String login = (String)jsonObj.get("login");
         String email = (String)jsonObj.get("email");
         String role = (String)jsonObj.get("role");
         String password = (String)jsonObj.get("password");
         String firstName = (String)jsonObj.get("firstName");
         String lastName = (String)jsonObj.get("lastName");

	 if (login.equals(loginToFind)) {

		        /*
       Person person = new Person().withFirstName(user.getFirstName()).
                withLastName(user.getLastName()).
                withLogin(user.getLogin()).
                withActive(true).
                withDefaultPassword(user.isPasswordChangeRequired()).
                withPassword(user.getPassword()).
                withRoles(user.getRole());
                */
            Person person = new Person();
	    person.setLogin(login);
	    person.setFirstName(firstName);
	    person.setLastName(lastName);
	    person.setPassword(password);

	    return person;
	 }

      }

      return null;


   }

   public String getEmail(String loginToFind)
   {
      System.out.println("MongoDBInterface getEmail");

      return getUserCollectionAttribute(loginToFind, "email");
   }

   public String getRole(String loginToFind)
   {
      System.out.println("MongoDBInterface getRole");

      return getUserCollectionAttribute(loginToFind, "role");
   }

   public String getPassword(String loginToFind)
   {
      System.out.println("MongoDBInterface getPassword");

      return getUserCollectionAttribute(loginToFind, "password");
   }


   public boolean get3LevelCollectionAttributeValue(String collectionName, String attributeName1ToSearch, String attributeName2ToSearch)
   {

      System.out.println("MongoDBInterface::get3LevelCollectionAttributeValue - collectionName: " + collectionName);
      System.out.println("MongoDBInterface::get3LevelCollectionAttributeValue - attributeName1ToSearch: " + attributeName1ToSearch);
      System.out.println("MongoDBInterface::get3LevelCollectionAttributeValue - attributeName2ToSearch: " + attributeName2ToSearch);
      System.out.flush();

      MongoClient mongoClient = getMongoClient();
      MongoDatabase db = mongoClient.getDatabase(mongoDBname);

      MongoCollection<Document> collection = db.getCollection(collectionName);
      String attributeValue ="";

      System.out.println("MongoDBInterface::get3LevelCollectionAttributeValue  - after parser call: collection: " + collection);
      System.out.flush();


      for (Document doc : collection.find())
      {
	 String jsonStr = doc.toJson();

         JSONObject jsonObj = new JSONObject(jsonStr);

         System.out.println("MongoDBInterface::get3LevelCollectionAttributeValue - for loop after toJson, jsonStr: " + jsonStr);
         System.out.flush();

         JSONObject idObj = jsonObj.getJSONObject("_id");
         System.out.println("MongoDBInterface::get3LevelCollectionAttributeValue - idObj: " + idObj);
         System.out.flush();

	 String launchId = idObj.getString("$oid");
         System.out.println("MongoDBInterface::get3LevelCollectionAttributeValue - launchId: " + launchId);
         System.out.flush();

	 if (launchId.equals(attributeName1ToSearch)) {

            System.out.println("MongoDBInterface::get3LevelCollectionAttributeValue - launchId = attributeName1ToSearch");
            System.out.flush();

	    if (attributeName2ToSearch == "") return true;

            JSONObject testCaseTreeObj = jsonObj.getJSONObject("testCaseTree");

            System.out.println("MongoDBInterface::get3LevelCollectionAttributeValue - testCaseTree: " + testCaseTreeObj);
            System.out.flush();

            JSONArray childrenArrayObj = testCaseTreeObj.getJSONArray("children");
            System.out.println("MongoDBInterface::get3LevelCollectionAttributeValue - children: " + childrenArrayObj);
            System.out.flush();

            for (int i = 0; i < childrenArrayObj.length(); i++) {

	       JSONObject childrenObj = childrenArrayObj.getJSONObject(i);
	       JSONArray testCasesArrayObj = childrenObj.getJSONArray("testCases");

               System.out.println("MongoDBInterface::get3LevelCollectionAttributeValue - testCasesArrayObj: " + 
			    testCasesArrayObj);
               System.out.flush();

	       for (int j = 0; j < testCasesArrayObj.length(); j++) {

	          JSONObject testCasesObj = testCasesArrayObj.getJSONObject(j);

	          String uuid = testCasesObj.getString("uuid");
                  System.out.println("MongoDBInterface::get3LevelCollectionAttributeValue - uuid: " + uuid);
                  System.out.flush();

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

      System.out.println("MongoDBInterface::getCollectionAttributeValue - collectionName, attributeNames ToSearch: " + collectionName + ", " + attribute1NameToSearch + ", " + attribute2NameToSearch);
      System.out.println("MongoDBInterface::getCollectionAttributeValue - attributeValues ToSearch: " + attribute1ValueToSearch + ", " + attribute2ValueToSearch);
      System.out.flush();

      MongoClient mongoClient = getMongoClient();
      MongoDatabase db = mongoClient.getDatabase(mongoDBname);

      MongoCollection<Document> collection = db.getCollection(collectionName);
      String attributeValue ="";

      JSONParser parser = new JSONParser();

      System.out.println("MongoDBInterface::getCollectionAttributeValue  - after parser call: collection: " + collection);
      System.out.flush();


      for (Document doc : collection.find())
      {
         String jsonStr = doc.toJson();

         System.out.println("MongoDBInterface::getCollectionAttributeValue - for loop after toJson, jsonStr: " + jsonStr);
         System.out.flush();

         JSONObject jsonObj = new JSONObject(jsonStr);

         String attributeValue_1="";
         boolean attr1ValueFoundFlag = false;
         if (attribute1NameToSearch.equals("attachments")) {
System.out.println("MongoDBInterface::getCollectionAttributeValue  - attachments 1 found");
System.out.println("1 jsonObj.get(attribute1NameToSearch): " + jsonObj.get(attribute1NameToSearch));
System.out.flush();

            JSONArray ary = jsonObj.getJSONArray(attribute1NameToSearch);
            for (int i = 0; i < ary.length(); i++) {
               JSONObject aryObj = ary.getJSONObject(i);
               String id = aryObj.getString("_id");
System.out.println("MongoDBInterface::getCollectionAttributeValue  - 1 JSON array loop: " + id);
System.out.flush();
               if (id.equals(attribute1ValueToSearch)) {
System.out.println("MongoDBInterface::getCollectionAttributeValue  - 1 attr1ValueFoundFlag = true");
System.out.flush();
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
System.out.println("MongoDBInterface::getCollectionAttributeValue  - attachments 2 found");
System.out.println("1 jsonObj.get(attribute2NameToSearch): " + jsonObj.get(attribute2NameToSearch));
System.out.flush();
            JSONArray ary = jsonObj.getJSONArray(attribute2NameToSearch);
            for (int i = 0; i < ary.length(); i++) {
                JSONObject aryObj = ary.getJSONObject(i);
                String id = aryObj.getString("_id");
System.out.println("MongoDBInterface::getCollectionAttributeValue  - 2 JSON array loop: " + id);
System.out.flush();
                if (id.equals(attribute2ValueToSearch)) {
System.out.println("MongoDBInterface::getCollectionAttributeValue  - 2 attr1ValueFoundFlag = true");
System.out.flush();
                   attr2ValueFoundFlag = true;
                }
            }
         } else {
	    attributeValue_2 = (String)jsonObj.get(attribute2NameToSearch);
         }

         System.out.println("MongoDBInterface::getCollectionAttributeValue - bottom of for loop, atttributeValue_1, attributeValue_2: " + attributeValue_1 + ", " + attributeValue_2);
         System.out.flush();

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

      System.out.println("MongoDBInterface::getCollectionAttributeValue - collectionName, attributeNameToSearch: " + collectionName + ", " + attributeNameToSearch);
      System.out.flush();

      MongoClient mongoClient = getMongoClient();
      MongoDatabase db = mongoClient.getDatabase(mongoDBname);

      MongoCollection<Document> collection = db.getCollection(collectionName);
      String attributeValue ="";

      JSONParser parser = new JSONParser();

      System.out.println("MongoDBInterface::getCollectionAttributeValue  - after parser call: collection: " + collection);
      System.out.flush();


      for (Document doc : collection.find())
      {
         String jsonStr = doc.toJson();

         System.out.println("MongoDBInterface::getCollectionAttributeValue - for loop after toJson, jsonStr: " + jsonStr);
         System.out.flush();

	 Object obj = null;
	 try {
	   obj = parser.parse(jsonStr);
	 } catch (ParseException e) {
           System.out.println("MongoDBInterface::getCollectionAttributeValue  - ParseException - jsonStr: " + jsonStr);
	 }

	 org.json.simple.JSONObject jsonObj = (org.json.simple.JSONObject)obj;

         System.out.println("MongoDBInterface::getCollectionAttributeValue  - jsonObj: " + jsonObj);
         System.out.flush();
         
	 attributeValue = (String)jsonObj.get(attributeNameToSearch);

         System.out.println("MongoDBInterface::getCollectionAttributeValue - 1 bottom of for loop, atttributeValue: " + attributeValue);
         System.out.flush();

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

      if (collection == null) {
	 System.out.println("getUserCollectionAttribute - collection = null");
	 System.out.flush();
      }

      for (Document doc : collection.find())
      {
	 String jsonStr = doc.toJson();

	 Object obj = null;
	 try {
	    obj = parser.parse(jsonStr);
	 } catch (ParseException e) {
            System.out.println("ParseException - jsonStr: " + jsonStr);
	 }

	 org.json.simple.JSONObject jsonObj = (org.json.simple.JSONObject)obj;

	 String login = (String)jsonObj.get("login");
	 String email = (String)jsonObj.get("email");
	 String role = (String)jsonObj.get("role");
	 String password = (String)jsonObj.get("password");

	 System.out.println("login: " + login);
	 System.out.println("email: " + email);
	 System.out.flush();

	 if (login.equals(loginToFind))
         {
	    System.out.println("email found: " + email);
	    System.out.flush();
            if (userAttribute == "email")
            {
	       return email;
            } else if (userAttribute == "role") {
               return role;
	    } else { // password
	       return password;
            }
	 }

      }

      mongoClient.close();

      return "";
   }

   public void updatePassword(String loginToFind, String password)
   {


      try {

         System.out.println("MongoDBInterface updatePassword");
	 System.out.flush();

	 MongoClient mongoClient = getMongoClient();
	 MongoDatabase db = mongoClient.getDatabase(mongoDBname);

         System.out.println("MongoDBInterface updatePassword - BEFORE call to updateOne");
	 System.out.flush();

	 updateOne(loginToFind, password, db);

         System.out.println("MongoDBInterface updatePassword - AFTER call to updateOne");
	 System.out.flush();


         mongoClient.close();

      } catch (Exception ex) {
         ex.printStackTrace();
      }
   }

   public void updateOne(String loginToFind, String password, MongoDatabase db )
   {

         MongoCollection<Document> collection = db.getCollection("users");

	 System.out.println("after db getCollection");
	 System.out.flush();

	 Document query = new Document("login", loginToFind);

	 System.out.println("after new doc login");
	 System.out.flush();

	 Document content = new Document();
	 content.append("password", password);
	 content.append("passwordChangeRequired", true);

	 Document updates = new Document("$set", content);

	 System.out.println("after new doc updates");
	 System.out.flush();

	 UpdateResult result = collection.updateOne(query, updates);
	 System.out.println("after updateMany - modified count: " + result.getModifiedCount());
	 System.out.flush();

	System.out.flush();
   }


}
