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

  @GET
  @Path("/")
  public Role getRole() {

     System.out.println("RoleCapabilityResource::getRole");
     System.out.flush();

     return Role.TESTER;

  }

  @POST
  @Path("/add/{role}/{cap}")
  public RoleCapability addRoleCapabilityPair(@PathParam("role") String role,
                                              @PathParam("cap")  String cap) {

     System.out.println("RoleCapabilityResource::addRoleCap");
     System.out.println("RoleCapabilityResource::addRoleCap - role: " + role + ", cap: " + cap);
     System.out.flush();

    RoleCapability roleCap = new RoleCapability();
    roleCap.setRole(Role.TESTER);
    roleCap.setCapability(Capability.READ);

    Session session = authProvider.getSession(request);
    return service.save(session, "test", roleCap);

  }


  @POST
  @Path("/delete/{role}/{cap}")
  public void deleteRoleCapabilityPair(@PathParam("role") String role,
                                       @PathParam("cap")  String cap) {

     System.out.println("RoleCapabilityResource::delRoleCap");
     System.out.println("RoleCapabilityResource::delRoleCap - role: " + role + ", cap: " + cap);
     System.out.flush();

    Session session = authProvider.getSession(request);
    service.delete(session, role, cap);

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
  @Path("/getcapsforrole/{role}")
  public RoleCapability getCapabilitiesForRole(@PathParam("role") String role) {

     System.out.println("RoleCapabilityResource::getCapsForRole");
     System.out.println("RoleCapabilityResource::getCapsForRole - role: " + role);
     System.out.flush();

     Session session = authProvider.getSession(request);
     return service.findOne(session, null, role);

  }


}



