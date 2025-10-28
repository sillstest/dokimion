package com.testquack.api.resources;

import com.testquack.api.utils.APIValidation;
import com.testquack.api.utils.FilterUtils;
import com.testquack.beans.Filter;
import com.testquack.beans.Project;
import com.testquack.services.BaseService;
import com.testquack.services.ProjectService;
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
@Path("/project")
public class ProjectResource extends BaseResource<Project> {

    @Autowired
    private ProjectService service;

    @Override
    protected Filter initFilter(HttpServletRequest hsr) {
        return FilterUtils.initFilter(hsr);
    }

    @Override
    protected BaseService<Project> getService() {
        return service;
    }

    @GET
    public Collection<Project> findFiltered() {
	try {
           return getService().findFiltered(getUserSession(), null, initFilter(request));
	} catch (Exception e) {
	   System.out.println("ProjectResource::findFiltered - exception: " + e);
	   System.out.flush();
	   return (Collection<Project>)null;
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
    public Project findOne(@ApiParam(value = "Entity Id", required = true) @PathParam("id") String id) {

        System.out.println("ProjectResource::findOne: id: " + id);
        System.out.flush();

        if (APIValidation.checkProjectId(getService().getMongoReplicaSet(),
                                    getService().getMongoUsername(),
                                    getService().getMongoPassword(),
                                    getService().getMongoDBName(),
                                    id) == false) {

System.out.println("ProjectResource::findOne: checkProject returned FALSE");
System.out.flush();

           return null;
        }
	try {
           return getService().findOne(getUserSession(), null, id);
	} catch (Exception e) {
	   System.out.println("ProjectResource::findOne - exception: " + e);
	   System.out.flush();
	   return (Project)null;
	}
    }

    @POST
    @ApiOperation(value = "Create entity", notes = "")
    @ApiResponses(value = {
            @ApiResponse(code = 403, message = "Access denied to the entity"),
            @ApiResponse(code = 200, message = "Created entity")
    })
    public Project create(@ApiParam(value = "Entity", required = true) Project entity) {
        ProjectService service = (ProjectService) getService();
System.out.println("ProjectResource:create - project entity: " + entity);
System.out.println("ProjectResource.create - getUserSession: " + getUserSession());
System.out.flush();

        try {
           return service.createProject(getUserSession(), entity);
	} catch (Exception e) {
	   System.out.println("ProjectResource::create - exception: " + e);
	   System.out.flush();
	   return (Project)null;
	}
    }

    @PUT
    @ApiOperation(value = "Update entity", notes = "")
    @ApiResponses(value = {
            @ApiResponse(code = 403, message = "Access denied to the entity"),
            @ApiResponse(code = 200, message = "Updated entity")
    })
    public Project update(@ApiParam(value = "Entity", required = true) Project entity) {
System.out.println("ProjectResource::update - project: " + entity);
System.out.flush();

        if (APIValidation.checkProjectId(getService().getMongoReplicaSet(),
            getService().getMongoUsername(),
            getService().getMongoPassword(),
            getService().getMongoDBName(),
            entity.getId()) == false) {

            System.out.println("ProjectResource::findOne: checkProject returned FALSE");
            System.out.flush();

            return null;
        }

	try {
           return getService().save(getUserSession(), null, entity);
	} catch (Exception e) {
	   System.out.println("ProjectResource::save - exception: " + e);
	   System.out.flush();
	   return (Project)null;
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

        if (APIValidation.checkProjectId(getService().getMongoReplicaSet(),
            getService().getMongoUsername(),
            getService().getMongoPassword(),
            getService().getMongoDBName(),
            id) == false) {

            System.out.println("ProjectResource::delete: checkProject returned FALSE");
            System.out.flush();

            return null;
        }

	try {
           getService().delete(getUserSession(), null, id);
           return ok().build();
	} catch (Exception e) {
	   System.out.println("ProjectResource::delete - exception: " + e);
	   System.out.flush();
           return Response.serverError().entity("ProjectResource Delete Failed").build();
	}


    }

}
