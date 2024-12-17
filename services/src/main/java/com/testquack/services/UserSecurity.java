package com.testquack.services;

import com.testquack.dal.RoleCapabilityUtils;
import com.testquack.beans.RoleCapability;
import com.testquack.beans.Role;
import com.testquack.beans.Capability;
import com.testquack.beans.Filter;
import com.testquack.beans.User;
import com.testquack.beans.Entity;
import com.testquack.beans.Launch;
import ru.greatbit.whoru.auth.Session;

import com.testquack.dal.UserRepository;


import java.util.List;
import java.util.Collection;

public class UserSecurity {

  public static boolean allowUserReadRequest(
		          String                   organizationId,
                          UserRepository           userRepository, 
                          String                   projectId,
                          String                   loginId,
			  String                   mongoReplicaSet,
			  String                   mongoUserName,
			  String                   mongoPassword,
			  String                   mongoDBName) {

     RoleCapabilityUtils.init(mongoReplicaSet, mongoUserName, mongoPassword, mongoDBName);

     User user = (User)userRepository.findOne(organizationId, projectId, loginId);

System.out.println("allowUserReadRequest - user: " + user);
System.out.flush();

     Role userRole = translateRoleFormat(user.getRole());

     return RoleCapabilityUtils.validateReadCapability(loginId);

  }

  public static boolean allowUserWriteRequest(
                          String                   organizationId, 
                          UserRepository           userRepository, 
                          String                   projectId,
                          String                   loginId,
			  String                   mongoReplicaSet,
			  String                   mongoUserName,
			  String                   mongoPassword,
			  String                   mongoDBName) {

System.out.println("allowUserWriteRequest - org id: " + organizationId);
System.out.println("allowUserWriteRequest - projectId: " + projectId);
System.out.println("allowUserWriteRequest - loginId: " + loginId);
System.out.flush();

     RoleCapabilityUtils.init(mongoReplicaSet, mongoUserName, mongoPassword, mongoDBName);

     User user = (User)userRepository.findOne(organizationId, projectId, loginId);

     Role userRole = translateRoleFormat(user.getRole());

     return RoleCapabilityUtils.validateWriteCapability(loginId);
  }

  public static boolean allowLaunchWriteRequest(List<String> roles, Entity entity) {

System.out.println("allowLaunchWriteRequest - roles, roles[0]: " + roles + ", " + roles.get(0));
System.out.println("allowLaunchWriteRequest - entity instanceof Launch: " + (entity instanceof Launch));
System.out.flush();

     if (entity instanceof Launch && roles.isEmpty() == false && roles.get(0).equals("OBSERVERONLY")) {
System.out.println("allowLaunchWriteRequest - launch write NOT allowed");
System.out.flush();
        return false;
     }

     return true;
  }


  public static boolean allowUserWriteRequest(
                          String                   organizationId, 
                          UserRepository           userRepository, 
                          String                   projectId,
                          String                   loginId,
                          List<Entity>             entityList ) {

System.out.println("allowUserWriteRequest - no body 1");
System.out.flush();

      return true;

   }


  public static boolean allowUserWriteRequest(
                          String                   organizationId, 
                          UserRepository           userRepository, 
                          String                   projectId,
                          String                   loginId,
                          Collection<Entity>       entityCollection ) {

System.out.println("allowUserWriteRequest - no body 2");
System.out.flush();

      return true;

   }

  public static boolean isAdmin(
                          UserRepository           userRepository, 
                          String                   loginId ) {

     if (loginId.equals("admin") == true) 
        return true;

     User user = (User)userRepository.findOne(null, null, loginId);
     Role userRole = translateRoleFormat(user.getRole());

System.out.println("UserSecurity::isAdmin - role: " + userRole);
System.out.flush();
     if (userRole == Role.ADMIN) {
System.out.println("UserSecurity::isAdmin - returning true");
System.out.flush();
        return true;
     }

     return false;

 }

  private static Role translateRoleFormat(String role) {

     Role returnRole = Role.TESTER;

     switch(role.toLowerCase()) {
        case "tester":
           returnRole = Role.TESTER;
           break;
        case "testdeveloper":
           returnRole = Role.TESTDEVELOPER;
           break;
        case "admin":
           returnRole = Role.ADMIN;
           break;
        case "observeronly":
           returnRole = Role.OBSERVERONLY;
           break;
        default:
           System.out.println("translateRoleFormat - role: " + role);
           System.out.flush();
           break;
      }
      return returnRole;
  }
}
