package com.testquack.services;

import com.testquack.beans.RoleCapability;
import com.testquack.beans.Role;
import com.testquack.beans.Capability;
import com.testquack.beans.Filter;
import com.testquack.beans.User;
import ru.greatbit.whoru.auth.Session;

import com.testquack.dal.UserRepository;
import com.testquack.dal.RoleCapabilityRepository;

import java.util.List;

public class UserSecurity {

  public static boolean allowUserReadRequest(
                          String                   organizationId, 
                          UserRepository           userRepository, 
                          RoleCapabilityRepository roleCapRepository,
                          String                   projectId,
                          String                   loginId) {

     User user = (User)userRepository.findOne(organizationId, projectId, loginId);

System.out.println("allowUserReadRequest - user: " + user);
System.out.println("allowUserReadRequest - user.getRole: " + user.getRole());
System.out.flush();

     Role userRole = Role.fromValue(user.getRole());

     List<RoleCapability> roleCapList = roleCapRepository.find(
             organizationId, projectId, new Filter());

System.out.println("allowUserReadRequest - roleCapList: " + roleCapList);
System.out.flush();

     for (RoleCapability roleCap : roleCapList) {
        if (userRole == roleCap.getRole()) {
           if (roleCap.getCapability() == Capability.READ) {
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

     User user = (User)userRepository.findOne(organizationId, projectId, loginId);

System.out.println("allowUserWriteRequest - user: " + user);
System.out.println("allowUserReadRequest - user.getRole: " + user.getRole());
System.out.flush();

     Role userRole = Role.fromValue(user.getRole());

     List<RoleCapability> roleCapList = roleCapRepository.find(
             organizationId, projectId, new Filter());

System.out.println("allowUserWriteequest - roleCapList: " + roleCapList);
System.out.flush();

     for (RoleCapability roleCap : roleCapList) {
        if (userRole == roleCap.getRole()) {
           if (roleCap.getCapability() == Capability.READWRITE) {
System.out.println("allowUserWrieRequest - roleCap allowed READWRITE: " + roleCap);
System.out.flush();

              return true;
           } 
        }
     }
 
     return false;

  }


}
