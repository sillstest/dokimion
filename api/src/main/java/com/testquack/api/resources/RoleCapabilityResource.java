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
import ru.greatbit.whoru.jaxrs.Authenticable;

import io.swagger.annotations.ApiOperation;
import io.swagger.annotations.ApiParam;
import io.swagger.annotations.ApiResponse;
import io.swagger.annotations.ApiResponses;

import org.json.*;
import java.util.Set;
import java.util.List;
import java.util.ArrayList;
import java.util.Collection;
import java.util.HashSet;
import java.util.stream.Collectors;

import javax.servlet.http.HttpServletRequest;
import javax.ws.rs.*;
import javax.ws.rs.core.Response;
import javax.ws.rs.core.MediaType;

import static javax.ws.rs.core.Response.ok;

@Authenticable
@Path("/rolecap")
public class RoleCapabilityResource extends BaseResource<RoleCapability> {

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
  @ApiOperation(value = "Create entity", notes = "")
  @ApiResponses(value = {
            @ApiResponse(code = 403, message = "Access denied to the entity"),
            @ApiResponse(code = 200, message = "Created entity")
  })
  public Response create(@ApiParam(value = "Entity", required = true) 
         RoleCapability entity) {

     RoleCapabilityService service = (RoleCapabilityService) getService();
System.out.println("RoleCapabilityResource:create - RC entity: " + (RoleCapability)entity);
System.out.println("RoleCapabilityResource:create - service: " + service);
System.out.println("RoleCapabilityResource.create - getUserSession: " + getUserSession());
System.out.flush();

    Session session = getUserSession();
    RoleCapability roleCap = (RoleCapability)entity;

    RoleCapabilityService roleCapService = (RoleCapabilityService)getService();

    RoleCapability rolecap = null;
    try {
       rolecap = roleCapService.save(session, "RoleCapability", roleCap);
    } catch (Exception e) {
       System.out.println("RoleCapabilityResource::create - exception: " + e);
       System.out.flush();
       return Response.serverError().entity("RoleCapabilityService Save Failed").build();
    }

     System.out.println("RoleCapabilityResource::addRoleCap - after service.save");
     System.out.flush();

     JSONObject jsonObj = new JSONObject();
     jsonObj.put("id", rolecap.getId());

     return Response.ok(jsonObj.toString(), MediaType.APPLICATION_JSON).build();

  }


  @DELETE
  @Path("/{id}")
  @ApiOperation(value = "Delete entity", notes = "")
  @ApiResponses(value = {
          @ApiResponse(code = 403, message = "Access denied to the entity"),
          @ApiResponse(code = 200, message = "Successful operation")
  })
  public Response delete(@ApiParam(value = "Id", required = true) @PathParam("id") String id) {

     System.out.println("RoleCapabilityResource::delRoleCap - id: " + id);
     System.out.flush();

     RoleCapabilityService roleCapService = (RoleCapabilityService)getService();

     try {
        roleCapService.delete(getUserSession(), "RoleCapability", id);
     } catch (Exception e) {
       System.out.println("RoleCapabilityResource::delete - exception: " + e);
       System.out.flush();
       return Response.serverError().entity("RoleCapabilityService Delete Failed").build();
     }

     System.out.println("RoleCapabilityResource::delRoleCap - after service.delete");
     System.out.flush();

     return ok().build();
  }

  @GET
  @Path("/getallroles")
  @ApiOperation(value = "Find all entities", notes = "")
  @ApiResponses(value = {
          @ApiResponse(code = 400, message = "Entity not found"),
          @ApiResponse(code = 403, message = "Access denied to the entity"),
          @ApiResponse(code = 200, message = "Successful operation")
  })
  public List<Role> getAllRoles() {

    System.out.println("RoleCapabilityResource::getAllRoles");
    System.out.flush();

    RoleCapabilityService roleCapService = (RoleCapabilityService)getService();

    List<RoleCapability> listRCs;
    try {
       listRCs = roleCapService.findFiltered(getUserSession(), "RoleCapability", new Filter());
    } catch (Exception e) {
       System.out.println("RoleCapabilityResource::getAllRoles - exception: " + e);
       System.out.flush();
       return (List<Role>)null;
    }

    List<Role> listRoles = new ArrayList<Role>();
    for (RoleCapability rolecap : listRCs) {
       listRoles.add(rolecap.getRole());
    }

    return listRoles;

  }

  @GET
  @Path("/getcapsforrole/{role}")
  @ApiOperation(value = "Find entity by role", notes = "")
  @ApiResponses(value = {
          @ApiResponse(code = 400, message = "Entity not found"),
          @ApiResponse(code = 403, message = "Access denied to the entity"),
          @ApiResponse(code = 200, message = "Successful operation")
  })
  public List<Capability> getCapabilitiesForRole(@PathParam("role") String role) {

    System.out.println("RoleCapabilityResource::getCapsForRole - role: " + role);
    System.out.flush();

    RoleCapabilityService roleCapService = (RoleCapabilityService)getService();

    List<RoleCapability> listRCs;
    try {
       listRCs = roleCapService.findFiltered(getUserSession(), "RoleCapability", new Filter().withField("role", Role.fromValue(role)));
    } catch (Exception e) {
       System.out.println("RoleCapabilityResource::getCapsForRole - exception: " + e);
       System.out.flush();
       return (List<Capability>)null;
    }

    List<Capability> listCaps = new ArrayList<Capability>();
    for (RoleCapability rolecap : listRCs) {
      if (rolecap.getRole() == Role.fromValue(role)) {
        listCaps.add(rolecap.getCapability());
      }
    }

    return listCaps;

  }


}



