package com.testquack.api.resources;

import com.testquack.dal.Logger;
import com.testquack.beans.Filter;
import com.testquack.beans.DefaultProjectAttributes;
import com.testquack.services.BaseService;
import com.testquack.services.UserService;
import com.testquack.services.DefaultProjectAttributesService;
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
@Path("/defaultprojectattributes")
public class DefaultProjectAttributesResource extends BaseResource<DefaultProjectAttributes> {

  @Autowired
  private DefaultProjectAttributesService service;

  @Override
  protected Filter initFilter(HttpServletRequest hsr) {
      return FilterUtils.initFilter(request);
  }

  @Override
  protected BaseService<DefaultProjectAttributes> getService() {
    return service;
  }


  @GET
  @Path("/getalldefaultprojattribs/{project}")
  @ApiOperation(value = "Find entities by project", notes = "")
  @ApiResponses(value = {
          @ApiResponse(code = 400, message = "Entity not found"),
          @ApiResponse(code = 403, message = "Access denied to the entity"),
          @ApiResponse(code = 200, message = "Successful operation")
  })
  public Collection<DefaultProjectAttributes> getAllDefaultProjectAttributes(
         @PathParam("project") String project) {

    Logger.info("DefaultProjectAttributesResource::getAllDefaultProjectAttributes");

    DefaultProjectAttributesService defaultProjAttribService = (DefaultProjectAttributesService)getService();
    List<DefaultProjectAttributes> dpaList = defaultProjAttribService.findFiltered(getUserSession(), "DefaultProjectAttributes", new Filter().withField("project", project));

    Logger.info("DefaultResource::getall - dpaList: " + dpaList);

    
    return dpaList;

  }

}



