package com.testquack.api.utils;

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

   String replicaSetProperty = "mongo.replicaSet=";
   String mongoUsernameProperty = "mongo.username=";
   String mongoPasswdProperty = "mongo.password=";
   String mongoDBnameProperty = "mongo.dbname=";
   String replicaSet, mongoUsername, mongoPasswd, mongoDBname;
   String propertiesFilename="/etc/dokimion/quack.properties";

   private MongoClient getMongoClient()
   {
      try {

         // read properties from file
         File myObj = new File(propertiesFilename);
         Scanner myReader = new Scanner(myObj);
         while (myReader.hasNextLine()) {
	   String data = myReader.nextLine();
	   if (data.startsWith(replicaSetProperty)) {
              replicaSet = data.substring(replicaSetProperty.length());
	   }
	   if (data.startsWith(mongoUsernameProperty)) {
              mongoUsername = data.substring(mongoUsernameProperty.length());
	   }
	   if (data.startsWith(mongoPasswdProperty)) {
              mongoPasswd = data.substring(mongoPasswdProperty.length());
	   }
	   if (data.startsWith(mongoDBnameProperty)) {
              mongoDBname = data.substring(mongoDBnameProperty.length());
	   }
         }
         myReader.close();
      } catch (FileNotFoundException e) {
         System.out.println("File Not Found exception");
      }
      System.out.println("getMongoClient - replicaSet: " + replicaSet);
      System.out.println("getMongoClient - mongoUsername: " + mongoUsername);
      System.out.println("getMongoClient - mongoPasswd: " + mongoPasswd);
      System.out.println("getMongoClient - mongoDBname: " + mongoDBname);
      System.out.flush();

      List<ServerAddress> addresses = Stream.of(replicaSet.split(",")).
		          map(String::trim).
	                  map(host-> {
                              String[] tokens = host.split(":");
                              return tokens.length == 2 ?
				      createServerAddress(tokens[0], Integer.parseInt(tokens[1])) :
				      createServerAddress(host);
			  }).
	                  collect(Collectors.toList());

      MongoCredential credential = MongoCredential.createCredential(mongoUsername, mongoDBname,
                                   mongoPasswd.toCharArray());

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
