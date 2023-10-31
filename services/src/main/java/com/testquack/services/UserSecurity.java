package com.testquack.services;

import com.testquack.beans.RoleCapability;
import com.testquack.beans.Role;
import com.testquack.beans.Capability;
import com.testquack.beans.Filter;
import com.testquack.beans.User;
import com.testquack.beans.Launch;
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
                          String                   loginId,
                          boolean	           launchFlag ) {

System.out.println("allowUserWriteRequest - org id: " + organizationId);
System.out.println("allowUserWriteRequest - projectId: " + projectId);
System.out.println("allowUserWriteRequest - loginId: " + loginId);
System.out.println("allowUserWriteRequest - launchFlag: " + launchFlag);
System.out.flush();

     if (launchFlag == true) {
        // allow anybody to write to a launch
        System.out.println("allowUserWriteRequest - entity is a Launch");
        System.out.flush();
        return true;
     }

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
 
     return false;
  }


  public static boolean allowUserWriteRequest(
                          String                   organizationId, 
                          UserRepository           userRepository, 
                          RoleCapabilityRepository roleCapRepository,
                          String                   projectId,
                          String                   loginId,
                          List<Entity>             entityList ) {

      return true;

   }


  public static boolean allowUserWriteRequest(
                          String                   organizationId, 
                          UserRepository           userRepository, 
                          RoleCapabilityRepository roleCapRepository,
                          String                   projectId,
                          String                   loginId,
                          Collection<Entity>       entityCollection ) {

      return true;

   }


  private static Role translateRoleFormat(String role) {

     Role returnRole = Role.TESTER;

     switch(role) {
        case "TESTER":
           returnRole = Role.TESTER;
           break;
        case "TESTDEVELOPER":
           returnRole = Role.TESTDEVELOPER;
           break;
        case "ADMIN":
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
