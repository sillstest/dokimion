
package com.testquack.dal;

import com.testquack.dal.MongoDBInterface;

public class RoleCapabilityUtils {

   private static MongoDBInterface s_mongoDBInterface;

   public static void init(String mongoReplicaSet, String mongoUserName, 
		           String mongoPassword, String mongoDBName) {

       s_mongoDBInterface = new MongoDBInterface();
       s_mongoDBInterface.setMongoDBProperties(mongoReplicaSet,
                                               mongoUserName,
					       mongoPassword,
					       mongoDBName);

   }

   public static boolean validateReadCapability(String login) {

      String role = s_mongoDBInterface.getRole(login);
      String capability = s_mongoDBInterface.getCapabilityForRole(role);

      switch (capability) {
         case "READ":
         case "READWRITE":
         case "ADMIN":
            return true;
         default:
            System.out.println("MongoDBInterface::validateReadCapability - invalid capability: " + capability);
            System.out.flush();
            return false;
      }      
   }

   public static boolean validateWriteCapability(String login) {

      String role = s_mongoDBInterface.getRole(login);
      String capability = s_mongoDBInterface.getCapabilityForRole(role);

      switch (capability) {
         case "READWRITE":
         case "ADMIN":
            return true;
         default:
            System.out.println("MongoDBInterface::validateWriteCapability - invalid capability: " + capability);
            System.out.flush();
            return false;
      }   

   }

}
