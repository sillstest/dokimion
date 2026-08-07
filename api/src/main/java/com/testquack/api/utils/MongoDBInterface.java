package com.testquack.api.utils;

import com.mongodb.client.MongoCollection;
import com.mongodb.client.MongoDatabase;
import com.mongodb.client.model.Filters;
import com.mongodb.client.result.UpdateResult;
import org.bson.Document;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.mongodb.MongoDatabaseFactory;
import org.springframework.stereotype.Component;
import ru.greatbit.whoru.auth.Person;

import org.json.JSONObject;
import org.json.JSONArray;
import org.json.simple.parser.*;


@Component
public class MongoDBInterface  {

   /**
    * Shares the application's single connection pool via Spring's MongoDatabaseFactory (the
    * `mongoDbFactory` bean set up by com.testquack.dal.MongoConfig, and already used by
    * gridFsTemplate in dal-context.xml).
    *
    * This class used to build its OWN MongoClient on every setMongoDBProperties() call and
    * never close it. Each orphaned client kept its minSize(10) pooled connections open for
    * the lifetime of the JVM, which is what exhausted mongod (25,605 connections against a
    * configured pool max of 300). Do not create a MongoClient here.
    *
    * NB: inject MongoDatabaseFactory, not MongoClient -- spring-data-mongodb's
    * AbstractMongoClientConfiguration.mongoClient() is NOT annotated @Bean (only
    * mongoTemplate, mongoDbFactory and mappingMongoConverter are), so there is no MongoClient
    * bean to autowire and asking for one fails context startup.
    *
    * Injection is via the constructor deliberately -- there is no no-arg constructor, so
    * `new MongoDBInterface()` no longer compiles and the leak cannot be reintroduced.
    */
   private final MongoDatabaseFactory mongoDbFactory;

   @Autowired
   public MongoDBInterface(MongoDatabaseFactory mongoDbFactory) {
      this.mongoDbFactory = mongoDbFactory;
   }

   /** Resolves ${mongo.dbname} off the shared pool. Cheap: no I/O, no new connections. */
   private MongoDatabase db() {
      return mongoDbFactory.getMongoDatabase();
   }

   public Person getPerson(String loginToFind) {

      // Query by login rather than scanning the whole users collection -- see the note in
      // getUserCollectionAttribute.
      Document user = db().getCollection("users").
              find(Filters.eq("login", loginToFind)).
              first();

      if (user == null) {
         return null;
      }

      Person person = new Person();
      person.setLogin(user.getString("login"));
      person.setFirstName(user.getString("firstName"));
      person.setLastName(user.getString("lastName"));
      person.setPassword(user.getString("password"));

      return person;
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

      MongoCollection<Document> collection = db().getCollection(collectionName);
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

      return false;
   }
   

   public boolean getCollectionAttributeValue(String collectionName, String attribute1NameToSearch, String attribute1ValueToSearch, String attribute2NameToSearch, String attribute2ValueToSearch)
   {

      System.out.println("MongoDBInterface::getCollectionAttributeValue - collectionName, attributeNames ToSearch: " + collectionName + ", " + attribute1NameToSearch + ", " + attribute2NameToSearch);
      System.out.println("MongoDBInterface::getCollectionAttributeValue - attributeValues ToSearch: " + attribute1ValueToSearch + ", " + attribute2ValueToSearch);
      System.out.flush();

      MongoCollection<Document> collection = db().getCollection(collectionName);
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

      return false;

   }


   public boolean getCollectionAttributeValue(String collectionName, String attributeNameToSearch, String attributeValueToSearch)
   {

      System.out.println("MongoDBInterface::getCollectionAttributeValue - collectionName, attributeNameToSearch: " + collectionName + ", " + attributeNameToSearch);
      System.out.flush();

      MongoCollection<Document> collection = db().getCollection(collectionName);
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

      return false;
   }

   private String getUserCollectionAttribute(String loginToFind, String userAttribute)
   {
      // Query by login rather than fetching every user and comparing in Java. This is on the
      // login path (getRole/getPassword/getEmail), so the old full-collection scan cost one
      // read of the entire users collection per login.
      Document user = db().getCollection("users").
              find(Filters.eq("login", loginToFind)).
              first();

      if (user == null) {
         return "";
      }

      // These were compared with ==, which happened to work only because every caller passes
      // a string literal (and literals are interned). Any non-literal argument fell silently
      // through to the password branch.
      if ("email".equals(userAttribute)) {
         return user.getString("email");
      } else if ("role".equals(userAttribute)) {
         return user.getString("role");
      } else { // password
         return user.getString("password");
      }
   }

   public void updatePassword(String loginToFind, String password)
   {


      try {

         System.out.println("MongoDBInterface updatePassword");
	 System.out.flush();

         System.out.println("MongoDBInterface updatePassword - BEFORE call to updateOne");
	 System.out.flush();

	 updateOne(loginToFind, password, db());

         System.out.println("MongoDBInterface updatePassword - AFTER call to updateOne");
	 System.out.flush();


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
