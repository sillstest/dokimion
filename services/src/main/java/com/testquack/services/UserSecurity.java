package com.testquack.services;

import com.testquack.beans.RoleCapability;
import com.testquack.beans.Role;
import com.testquack.beans.Capability;
import com.testquack.beans.Filter;
import com.testquack.beans.User;
import com.testquack.beans.Entity;
import ru.greatbit.whoru.auth.Session;

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

System.out.println("allowUserReadRequest - user: " + user);
System.out.flush();

     Role userRole = translateRoleFormat(user.getRole());

     List<RoleCapability> roleCapList = roleCapRepository.find(
             organizationId, projectId, new Filter());

System.out.println("allowUserReadRequest - roleCapList: " + roleCapList);
System.out.flush();

     for (RoleCapability roleCap : roleCapList) {
        if (userRole == roleCap.getRole()) {
System.out.println("allowUserReadRequest - roleCap matched role: " + roleCap.getRole());
System.out.println("allowUserReadRequest - cap: " + roleCap.getCapability().value());
System.out.flush();
           if ((roleCap.getCapability() == Capability.READ) ||
               (roleCap.getCapability() == Capability.READWRITE) ||
               (roleCap.getCapability() == Capability.ADMIN)) {
System.out.println("allowUserReadRequest - roleCap allowed READ: " + roleCap);
System.out.flush();
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

System.out.println("allowUserWriteRequest - org id: " + organizationId);
System.out.println("allowUserWriteRequest - projectId: " + projectId);
System.out.println("allowUserWriteRequest - loginId: " + loginId);
System.out.flush();

     User user = (User)userRepository.findOne(organizationId, projectId, loginId);

     Role userRole = translateRoleFormat(user.getRole());

     List<RoleCapability> roleCapList = roleCapRepository.find(
             organizationId, projectId, new Filter());

System.out.println("allowUserWriteequest - roleCapList: " + roleCapList);
System.out.flush();

     for (RoleCapability roleCap : roleCapList) {
        if (userRole == roleCap.getRole()) {
System.out.println("allowUserWriteRequest - matched role: " + roleCap.getRole().value());
System.out.println("allowUserWriteRequest - cap: " + roleCap.getCapability().value());
System.out.flush();

           if ((roleCap.getCapability() == Capability.READWRITE) || 
               (roleCap.getCapability() == Capability.ADMIN)) {
System.out.println("allowUserWriteRequest - roleCap allowed READWRITE or ADMIN: " + roleCap);
System.out.flush();

              return true;
           } 
        }
     }
 
System.out.println("allowUserWriteRequest - returning false");
System.out.flush();
     return false;
  }


  public static boolean allowUserWriteRequest(
                          String                   organizationId, 
                          UserRepository           userRepository, 
                          RoleCapabilityRepository roleCapRepository,
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
                          RoleCapabilityRepository roleCapRepository,
                          String                   projectId,
                          String                   loginId,
                          Collection<Entity>       entityCollection ) {

System.out.println("allowUserWriteRequest - no body 2");
System.out.flush();

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
        default:
           System.out.println("translateRoleFormat - role: " + role);
           System.out.flush();
           break;
      }
      return returnRole;
  }
}
