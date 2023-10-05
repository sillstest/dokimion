package com.testquack.api.resources;

import com.testquack.beans.Filter;
import com.testquack.beans.RoleCapability;
import com.testquack.beans.Role;
import com.testquack.beans.Capability;
import com.testquack.services.BaseService;
import com.testquack.services.RoleCapabilityService;
import com.testquack.api.utils.FilterUtils;
import org.springframework.beans.factory.annotation.Autowired;
import ru.greatbit.whoru.auth.SessionProvider;
import ru.greatbit.whoru.auth.Session;

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
  @Path("/add/{role}/{cap}")
  public RoleCapability addRoleCapabilityPair(@PathParam("role") Role role,
                                              @PathParam("cap")  Capability cap) {

    RoleCapability roleCap = new RoleCapability();
    roleCap.setRole(role);
    roleCap.setCapability(cap);

    return service.save(getUserSession(), null, roleCap);

  }


  @POST
  @Path("/delete/{role}/{cap}")
  public void deleteRoleCapabilityPair(@PathParam("role") Role role,
                                          @PathParam("cap")  Capability cap) {

    service.delete(getUserSession(), role.value(), cap.value());

  }

  @GET
  @Path("/getallroles")
  public Set<Role> getAllRoles() {

     Set<Role> rolesSet = service.findAll().stream().map(RoleCapability::getRole).
                collect(Collectors.toSet());

     return rolesSet;
  }

  @GET
  @Path("/getcapsforrole/{role}")
  public RoleCapability getCapabilitiesForRole(@PathParam("role") Role role) {

     return service.findOne(getUserSession(), null, role.value());

  }

}



