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
        return getService().findFiltered(getUserSession(), null, initFilter(request));
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

System.out.println("ProjectResource::findOne: checkProject returned FALSE - did NOT find it");
System.out.flush();

           Project project = null;
           return project;
        }
        return getService().findOne(getUserSession(), id, id);
    }

    @POST
    @ApiOperation(value = "Create entity", notes = "")
    @ApiResponses(value = {
            @ApiResponse(code = 403, message = "Access denied to the entity"),
            @ApiResponse(code = 200, message = "Created entity")
    })
    public Project create(@ApiParam(value = "Entity", required = true) Project entity) {
        ProjectService service = (ProjectService) getService();
System.out.println("ProjectResource:create - service: " + service);
System.out.println("ProjectResource.create - getUserSession: " + getUserSession());
System.out.flush();


        if (APIValidation.checkProjectId(getService().getMongoReplicaSet(),
            getService().getMongoUsername(),
            getService().getMongoPassword(),
            getService().getMongoDBName(),
            entity.getId()) == true) {

            System.out.println("ProjectResource::create: checkProject returned TRUE - found it");
            System.out.flush();

            Project project = null;
            return project;
        }

        return service.createProject(getUserSession(), entity);
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

            System.out.println("ProjectResource::findOne: checkProject returned FALSE - did NOT find it");
            System.out.flush();

            Project project = null;
            return project;
        }

        return getService().save(getUserSession(), null, entity);
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

            System.out.println("ProjectResource::findOne: checkProject returned FALSE - did NOT find it");
            System.out.flush();

            Response response = null;
            return response;
        }

        getService().delete(getUserSession(), null, id);
        return ok().build();
    }

}
