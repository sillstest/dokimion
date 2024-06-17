package com.testquack.services;

import com.testquack.dal.Logger;
import com.testquack.beans.RoleCapability;
import com.testquack.beans.Role;
import com.testquack.beans.Capability;
import com.testquack.beans.Filter;
import com.testquack.beans.User;
import com.testquack.beans.Entity;
import com.testquack.beans.Launch;
import ru.greatbit.whoru.auth.Session;

import com.testquack.dal.Logger;
import com.testquack.dal.UserRepository;
import com.testquack.dal.RoleCapabilityRepository;

import java.util.List;
import java.util.Collection;

public class UserSecurity {

  public static boolean allowUserReadRequest(
                          String                   organizationId, 
                          UserRepository           userRepository, 
                          RoleCapabilityRepository roleCapRepository,
                          String                   projectId,
                          String                   loginId) {
     User user = (User)userRepository.findOne(organizationId, projectId, loginId);

Logger.info("allowUserReadRequest - user: " + user);

     Role userRole = translateRoleFormat(user.getRole());

     List<RoleCapability> roleCapList = roleCapRepository.find(
             organizationId, projectId, new Filter());

Logger.info("allowUserReadRequest - roleCapList: " + roleCapList);

     for (RoleCapability roleCap : roleCapList) {
        if (userRole == roleCap.getRole()) {
Logger.info("allowUserReadRequest - roleCap matched role: " + roleCap.getRole());
Logger.info("allowUserReadRequest - cap: " + roleCap.getCapability().value());
           if ((roleCap.getCapability() == Capability.READ) ||
               (roleCap.getCapability() == Capability.READWRITE) ||
               (roleCap.getCapability() == Capability.ADMIN)) {
Logger.info("allowUserReadRequest - roleCap allowed READ: " + roleCap);
              return true;
           } 
        }

     }
 
     return false;

  }

  public static boolean allowUserWriteRequest(
                          String                   organizationId, 
                          UserRepository           userRepository, 
                          RoleCapabilityRepository roleCapRepository,
                          String                   projectId,
                          String                   loginId) {

Logger.info("allowUserWriteRequest - org id: " + organizationId);
Logger.info("allowUserWriteRequest - projectId: " + projectId);
Logger.info("allowUserWriteRequest - loginId: " + loginId);

     User user = (User)userRepository.findOne(organizationId, projectId, loginId);

     Role userRole = translateRoleFormat(user.getRole());

     List<RoleCapability> roleCapList = roleCapRepository.find(
             organizationId, projectId, new Filter());

Logger.info("allowUserWriteequest - roleCapList: " + roleCapList);

     for (RoleCapability roleCap : roleCapList) {
        if (userRole == roleCap.getRole()) {
Logger.info("allowUserWriteRequest - matched role: " + roleCap.getRole().value());
Logger.info("allowUserWriteRequest - cap: " + roleCap.getCapability().value());

           if ((roleCap.getCapability() == Capability.READWRITE) || 
               (roleCap.getCapability() == Capability.ADMIN)) {
Logger.info("allowUserWriteRequest - roleCap allowed READWRITE or ADMIN: " + roleCap);

              return true;
           } 
        }
     }
 
Logger.info("allowUserWriteRequest - returning false");
     return false;
  }

  public static boolean allowLaunchWriteRequest(List<String> roles, Entity entity) {

Logger.info("allowLaunchWriteRequest - roles, roles[0]: " + roles + ", " + roles.get(0));
Logger.info("allowLaunchWriteRequest - entity instanceof Launch: " + (entity instanceof Launch));

     if (entity instanceof Launch && roles.isEmpty() == false && roles.get(0).equals("OBSERVERONLY")) {
Logger.info("allowLaunchWriteRequest - launch write NOT allowed");
        return false;
     }

     return true;
  }


  public static boolean allowUserWriteRequest(
                          String                   organizationId, 
                          UserRepository           userRepository, 
                          RoleCapabilityRepository roleCapRepository,
                          String                   projectId,
                          String                   loginId,
                          List<Entity>             entityList ) {

Logger.info("allowUserWriteRequest - no body 1");

      return true;

   }


  public static boolean allowUserWriteRequest(
                          String                   organizationId, 
                          UserRepository           userRepository, 
                          RoleCapabilityRepository roleCapRepository,
                          String                   projectId,
                          String                   loginId,
                          Collection<Entity>       entityCollection ) {

Logger.info("allowUserWriteRequest - no body 2");

      return true;

   }

  public static boolean isAdmin(
                          UserRepository           userRepository, 
                          RoleCapabilityRepository roleCapRepository,
                          String                   loginId ) {

     if (loginId.equals("admin") == true) 
        return true;

     User user = (User)userRepository.findOne(null, null, loginId);
     Role userRole = translateRoleFormat(user.getRole());

Logger.info("UserSecurity::isAdmin - role: " + userRole);
     if (userRole.equals("ADMIN") == true)
        return true;

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
           Logger.info("translateRoleFormat - role: " + role);
           break;
      }
      return returnRole;
  }
}
