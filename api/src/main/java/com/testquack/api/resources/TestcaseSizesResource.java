package com.testquack.api.resources;

import com.testquack.beans.Filter;
import com.testquack.beans.TestcaseSizes;
import com.testquack.services.BaseService;
import com.testquack.services.TestcaseSizesService;
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
@Path("/testcasesizes")
public class TestcaseSizesResource extends BaseResource<TestcaseSizes> {

  @Autowired
  private TestcaseSizesService service;

  @Override
  protected Filter initFilter(HttpServletRequest hsr) {
      return FilterUtils.initFilter(request);
  }

  @Override
  protected BaseService<TestcaseSizes> getService() {
    return service;
  }

  @POST
  @ApiOperation(value = "Create entity", notes = "")
  @ApiResponses(value = {
            @ApiResponse(code = 403, message = "Access denied to the entity"),
            @ApiResponse(code = 200, message = "Created entity")
  })
  public Response create(@ApiParam(value = "Entity", required = true) 
         TestcaseSizes entity) {

     TestcaseSizesService service = (TestcaseSizesService) getService();

System.out.println("TestcaseSizesResource:create - RC entity: " + (TestcaseSizes)entity);
System.out.println("TestcaseSizesResource:create - service: " + service);
System.out.println("TestcaseSizesResource.create - getUserSession: " + getUserSession());
System.out.flush();

    Session session = getUserSession();
    TestcaseSizes tcSizesEntity = (TestcaseSizes)entity;

    TestcaseSizesService tcSizesService = (TestcaseSizesService)getService();

    TestcaseSizes tcSizes = tcSizesService.save(session, "TestcaseSizes", tcSizesEntity);

    JSONObject jsonObj = new JSONObject();
    jsonObj.put("id", tcSizes.getId());

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

     System.out.println("TestcaseSizesResource::delete - id: " + id);
     System.out.flush();

     TestcaseSizesService tcSizesService = (TestcaseSizesService)getService();
     tcSizesService.delete(getUserSession(), "TestcaseSizes", id);

     System.out.println("TestcaseSizesResource::delete - after service.delete");
     System.out.flush();

     return ok().build();
  }

  @GET
  @Path("/getalltcsizes")
  @ApiOperation(value = "Find all entities", notes = "")
  @ApiResponses(value = {
          @ApiResponse(code = 400, message = "Entity not found"),
          @ApiResponse(code = 403, message = "Access denied to the entity"),
          @ApiResponse(code = 200, message = "Successful operation")
  })
  public List<TestcaseSizes> getAllTestcaseSizes() {

    System.out.println("TestcaseSizesResource::getAllTestcaseSizes");
    System.out.flush();

    TestcaseSizesService tcSizesService = (TestcaseSizesService)getService();
    List<TestcaseSizes> listTCSizes = tcSizesService.findFiltered(getUserSession(), "TestcaseSizes", new Filter());

    return listTCSizes;

  }

}



