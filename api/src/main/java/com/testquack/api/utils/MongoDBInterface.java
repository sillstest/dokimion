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
import org.bson.Document;
import org.bson.conversions.Bson;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import static com.mongodb.internal.connection.ServerAddressHelper.createServerAddress;

import org.json.simple.JSONObject;
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
System.out.println("setMongoDBProperties - password: " + password);
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

         System.out.println("MongoDBInterface - decryptedPasswd: " + decryptedPasswd);
         System.out.flush();

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
      System.out.println("MongoDBInterface getEmail");

      return getUserCollectionAttribute(loginToFind, "email");
   }

   public String getRole(String loginToFind)
   {
      System.out.println("MongoDBInterface getEmail");

      return getUserCollectionAttribute(loginToFind, "role");
   }

   public String get3LevelCollectionAttributeValue(String collectionName, String attributeNameToSearch)
   {

      System.out.println("MongoDBInterface::getCollectionAttributeValue - collectionName, attributeNameToSearch: " + collectionName + ", " + attributeNameToSearch);
      System.out.flush();

      MongoClient mongoClient = getMongoClient();
      MongoDatabase db = mongoClient.getDatabase(mongoDBname);

      MongoCollection<Document> collection = db.getCollection(collectionName);
      String attributeValue ="";

      JSONParser parser = new JSONParser();

      System.out.println("MongoDBInterface::get3LevelCollectionAttributeValue  - after parser call: collection: " + collection);
      System.out.flush();


      for (Document doc : collection.find())
      {
         for (String key : doc.keySet()) {

            Object value = doc.get(key);
            Document newDoc = new Document(key, value);
            String jsonString = newDoc.toJson();

            //String jsonStr = doc.toJson();

            System.out.println("MongoDBInterface::get3LevelCollectionAttributeValue - for loop after toJson, jsonStr: " + jsonString);
            System.out.flush();


            for (String key1: newDoc.keySet()) {

               Object value1 = newDoc.get(key1);
               Document newDoc1 = new Document(key1, value1);
               String jsonString1 = newDoc1.toJson();


               System.out.println("MongoDBInterface::get3LevelCollectionAttributeValue - for loop after toJson, jsonStr: " + jsonString1);
               System.out.flush();
   
            }

         }

      }

      mongoClient.close();


      return attributeValue;
   }
   
   public String getCollectionAttributeValue(String collectionName, String attributeNameToSearch)
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

	      JSONObject jsonObj = (JSONObject)obj;

         System.out.println("MongoDBInterface::getCollectionAttributeValue  - obj: " + obj);
         System.out.flush();
         
      
	      attributeValue = (String)jsonObj.get(attributeNameToSearch);

         System.out.println("MongoDBInterface::getCollectionAttributeValue - 1 bottom of for loop, atttributeValue: " + attributeValue);
         System.out.flush();

      }


      mongoClient.close();


      return attributeValue;
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
            System.out.println("ParseException - jsonStr: " + jsonStr);
	 }

	 JSONObject jsonObj = (JSONObject)obj;

	 String login = (String)jsonObj.get("login");
	 String email = (String)jsonObj.get("email");
	 String role = (String)jsonObj.get("role");

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

         System.out.println("MongoDBInterface updatePassword");

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

	 UpdateResult result = collection.updateMany(query, updates);
	 System.out.println("after updateMany - modified count: " + result.getModifiedCount());


	 System.out.flush();


   }


}
