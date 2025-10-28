package com.testquack.api.resources;

import com.testquack.beans.Filter;
import com.testquack.beans.ProjectGroup;
import com.testquack.services.BaseService;
import com.testquack.services.ProjectGroupService;
import io.swagger.annotations.ApiOperation;
import io.swagger.annotations.ApiParam;
import io.swagger.annotations.ApiResponse;
import io.swagger.annotations.ApiResponses;
import org.springframework.beans.factory.annotation.Autowired;
import ru.greatbit.whoru.jaxrs.Authenticable;

import javax.servlet.http.HttpServletRequest;
import javax.ws.rs.*;
import javax.ws.rs.core.Response;
import java.util.Collection;

import static javax.ws.rs.core.Response.ok;

@Authenticable
@Path("/project-group")
public class ProjectGroupResource extends BaseResource<ProjectGroup> {

    @Autowired
    private ProjectGroupService service;

    @Override
    protected Filter initFilter(HttpServletRequest hsr) {
        return new Filter();
    }

    @Override
    protected BaseService<ProjectGroup> getService() {
        return service;
    }

    @GET
    public Collection<ProjectGroup> findFiltered() {
	try {
           return getService().findFiltered(getUserSession(), null, initFilter(request));
	} catch (Exception e) {
           System.out.println("ProjectGroupResource::findFiltered - exception: " + e);
	   System.out.flush();
	   return (Collection<ProjectGroup>)null;
	}
    }

    @GET
    @Path("/{id}")
    @ApiOperation(value = "Find entity by id", notes = "")
    @ApiResponses(value = {
            @ApiResponse(code = 400, message = "Entity not found"),
            @ApiResponse(code = 403, message = "Access denied to the entity"),
            @ApiResponse(code = 200, message = "Successful operation")
    })
    public ProjectGroup findOne(@ApiParam(value = "Entity Id", required = true) @PathParam("id") String id) {
	try {
           return getService().findOne(getUserSession(), null, id);
	} catch (Exception e) {
           System.out.println("ProjectGroupResource::findOne - exception: " + e);
	   System.out.flush();
	   return (ProjectGroup)null;
	}
    }

    @POST
    @ApiOperation(value = "Create entity", notes = "")
    @ApiResponses(value = {
            @ApiResponse(code = 403, message = "Access denied to the entity"),
            @ApiResponse(code = 200, message = "Created entity")
    })
    public ProjectGroup create(@ApiParam(value = "Entity", required = true) ProjectGroup entity) {
        entity.setId(null);

	try {
           return getService().save(getUserSession(), null, entity);
	} catch (Exception e) {
           System.out.println("ProjectGroupResource::create - exception: " + e);
	   System.out.flush();
	   return (ProjectGroup)null;
	}
	   
    }

    @PUT
    @ApiOperation(value = "Update entity", notes = "")
    @ApiResponses(value = {
            @ApiResponse(code = 403, message = "Access denied to the entity"),
            @ApiResponse(code = 200, message = "Updated entity")
    })
    public ProjectGroup update(@ApiParam(value = "Entity", required = true) ProjectGroup entity) {

	try {
           return getService().save(getUserSession(), null, entity);
	} catch (Exception e) {
           System.out.println("ProjectGroupResource::update - exception: " + e);
	   System.out.flush();
	   return (ProjectGroup)null;
	}
    }


    @DELETE
    @Path("/{id}")
    @ApiOperation(value = "Delete entity", notes = "")
    @ApiResponses(value = {
            @ApiResponse(code = 403, message = "Access denied to the entity"),
            @ApiResponse(code = 200, message = "Successful operation")
    })
    public Response delete(@ApiParam(value = "Id", required = true) @PathParam("id") String id) {

	try {
           getService().delete(getUserSession(), null, id);
           return ok().build();
	} catch (Exception e) {
           System.out.println("ProjectGroupResource::delete: " + e);
           System.out.flush();
           return Response.serverError().entity("ProjectGroupResource Delete Failed").build();
	}
    }

}
