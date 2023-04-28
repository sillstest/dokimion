package com.testquack.api;

import com.mongodb.client.MongoCollection;
import com.mongodb.client.MongoDatabase;
import com.mongodb.client.MongoClient;
import com.mongodb.client.MongoClients;
import com.mongodb.client.FindIterable;
import org.bson.Document;
import org.bson.types.ObjectId;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.mongodb.config.AbstractMongoClientConfiguration;

import com.mongodb.BasicDBObject;
import com.mongodb.DBObject;
import com.mongodb.DBCursor;
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

import static com.mongodb.MongoCredential.createCredential;
import static com.mongodb.internal.connection.ServerAddressHelper.createServerAddress;
import static org.apache.commons.lang3.StringUtils.isEmpty;

@Configuration
public class MongoDBInterface {

   public String getEmail(String loginToFind)
   {
      System.out.println("MongoDBInterface getEmail");

      MongoClient mongoClient = MongoClients.create("mongodb://quack1.psonet:27017");

      MongoDatabase db = mongoClient.getDatabase("test");

      System.out.println("admin mongo database attached");

      MongoCollection<Document> collection = db.getCollection("users");

      System.out.println("users collection retrieved");

      FindIterable<Document> myDocs = collection.find();

      System.out.println("myDocs retrieved from collection");

      JSONParser parser = new JSONParser();

      for (Document doc : myDocs)
      {
	 String jsonStr = doc.toJson();

	 System.out.println("json: " + jsonStr);

	 Object obj = null;
	 try {
	    obj = parser.parse(jsonStr);
	 } catch (ParseException e) {
            System.out.println("ParseException - jsonStr: " + jsonStr);
	 }

	 JSONObject jsonObj = (JSONObject)obj;

	 System.out.println(jsonObj);

	 String login = (String)jsonObj.get("login");

	 System.out.println(login);


	 String email = (String)jsonObj.get("email");

	 System.out.println(email);

	 if (login == loginToFind)
         {
	    System.out.println("email found: " + email);
	    return email;
	 }

      }


      return "";
   }
}
