package com.testquack.api.utils;

import com.mongodb.client.MongoCollection;
import com.mongodb.client.MongoDatabase;
import com.mongodb.MongoClient;
import com.mongodb.MongoClientURI;
import com.mongodb.ServerAddress;
import com.mongodb.client.MongoClients;
import com.mongodb.client.FindIterable;
import com.mongodb.client.model.Filters;
import com.mongodb.client.model.Updates;
import com.mongodb.client.model.UpdateOptions;
import com.mongodb.client.result.UpdateResult;
import org.bson.Document;
import org.bson.conversions.Bson;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.mongodb.config.AbstractMongoClientConfiguration;

import com.mongodb.BasicDBObject;
import com.mongodb.DBObject;
import com.mongodb.DBCursor;
import com.mongodb.client.MongoCursor;
import com.mongodb.DBCollection;

import org.json.simple.JSONObject;
import org.json.simple.parser.*;

import java.io.FileReader;
import java.io.IOException;
import java.io.Reader;
import java.util.List;
import java.util.ArrayList;
import java.util.Collection;
import java.util.stream.Collectors;
import java.util.stream.Stream;


@Configuration
public class MongoDBInterface {

   public String getEmail(String loginToFind)
   {
      System.out.println("MongoDBInterface getEmail");

      MongoClient mongoClient = new MongoClient(new MongoClientURI("mongodb://quack1.psonet:27017"));

      MongoDatabase db = mongoClient.getDatabase("test");

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

	 System.out.println("login: " + login);
	 System.out.println("email: " + email);
	 System.out.flush();

	 if (login.equals(loginToFind))
         {
	    System.out.println("email found: " + email);
	    System.out.flush();
	    return email;
	 }

      }


      return "";
   }

   public void updatePassword(String loginToFind, String password)
   {


      try {

         System.out.println("MongoDBInterface updatePassword");


         //MongoClient mongoClient = MongoClients.create("mongodb://quack1.psonet:27017");
         MongoClient mongoClient = new MongoClient(
		new MongoClientURI(
		"mongodb://quack1.psonet:27017,quack2.psonet:27017,quack3.psonet:27017/?replicaSet=rs0"));


         MongoDatabase db = mongoClient.getDatabase("test");

	 updateOne(loginToFind, password, db);

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

	 //Bson updates = Updates.combine(Updates.set("password", password), 
			                //Updates.set("passwordChangeRequired", "true"));

	 Document updates = new Document("$set", new Document("password", password));

	 System.out.println("after new doc updates");
	 System.out.flush();

	 //UpdateOptions options = new UpdateOptions().upsert(true);

	 UpdateResult result = collection.updateOne(query, updates);
	 System.out.println("after updateOne - modified count: " + result.getModifiedCount());
	 System.out.flush();


   }


}
