package com.testquack.api.resources;

import com.testquack.beans.Filter;
import com.testquack.beans.RoleCapability;
import com.testquack.beans.Role;
import com.testquack.beans.User;
import com.testquack.beans.Capability;
import com.testquack.services.BaseService;
import com.testquack.services.UserService;
import com.testquack.services.RoleCapabilityService;
import com.testquack.api.utils.FilterUtils;
import org.springframework.beans.factory.annotation.Autowired;
import ru.greatbit.whoru.auth.SessionProvider;
import ru.greatbit.whoru.auth.AuthProvider;
import ru.greatbit.whoru.auth.Session;
import ru.greatbit.whoru.auth.Person;

import java.util.Set;
import java.util.HashSet;
import java.util.stream.Collectors;

import javax.servlet.http.HttpServletRequest;
import javax.ws.rs.*;



@Path("/rolecap")
public class RoleCapabilityResource extends BaseResource<RoleCapability> {

  @Autowired
  SessionProvider sessionProvider;

  @Autowired
  AuthProvider authProvider;

  @Autowired
  private RoleCapabilityService service;

  @Override
  protected Filter initFilter(HttpServletRequest hsr) {
      return FilterUtils.initFilter(request);
  }

  @Override
  protected BaseService<RoleCapability> getService() {
    return service;
  }

  @POST
  @Path("/add/{projectId}/{role}/{cap}")
  public RoleCapability addRoleCapabilityPair(@PathParam("projectId") String projectId,
                                              @PathParam("role") String role,
                                              @PathParam("cap")  String cap) {

     System.out.println("RoleCapabilityResource::addRoleCap");
     System.out.println("RoleCapabilityResource::addRoleCap - role: " + role + ", cap: " + cap);
     System.out.flush();


    RoleCapability roleCap = mapRoleCapabilityStringToEnum(role, cap);
    Session session = authProvider.getSession(request);

    return service.save(session, projectId, roleCap);

  }


  @POST
  @Path("/delete/{projectId}/{role}/{cap}")
  public void deleteRoleCapabilityPair(@PathParam("projectId") String projectId,
                                       @PathParam("role") String role,
                                       @PathParam("cap")  String cap) {

     System.out.println("RoleCapabilityResource::delRoleCap");
     System.out.println("RoleCapabilityResource::delRoleCap - role: " + role + ", cap: " + cap);
     System.out.flush();

    Session session = authProvider.getSession(request);
    RoleCapability roleCap = mapRoleCapabilityStringToEnum(role, cap);

    service.delete(session, projectId, roleCap.getId());

  }

  @GET
  @Path("/getallroles")
  public Set<Role> getAllRoles() {

     System.out.println("RoleCapabilityResource::getAllRoles");
     System.out.flush();

     Set<Role> rolesSet = service.findAll().stream().map(RoleCapability::getRole).
                collect(Collectors.toSet());

     return rolesSet;
  }

  @GET
  @Path("/getcapsforrole/{projectId}/{role}")
  public RoleCapability getCapabilitiesForRole(@PathParam("projectId") String projectId,
                                               @PathParam("role") String role) {

     System.out.println("RoleCapabilityResource::getCapsForRole");
     System.out.println("RoleCapabilityResource::getCapsForRole - role: " + role);
     System.out.flush();

     Session session = authProvider.getSession(request);
     return service.findOne(session, projectId, role);

  }


  private RoleCapability mapRoleCapabilityStringToEnum(String role, String cap) {

    RoleCapability roleCap = new RoleCapability();
    if (role == "Tester") {
       roleCap.setRole(Role.TESTER);
    } else if (role == "Test Developer") {
       roleCap.setRole(Role.TEST_DEVELOPER);
    } else if (role == "Admin") {
       roleCap.setRole(Role.ADMIN);
    }

    if (cap == "read") {
       roleCap.setCapability(Capability.READ);
    } else if (cap == "write") {
       roleCap.setCapability(Capability.WRITE);
    } else if (cap == "readwrite") {
       roleCap.setCapability(Capability.READWRITE);
    } else if (cap == "admin") {
       roleCap.setCapability(Capability.ADMIN);
    }

   return roleCap;
  }

}



