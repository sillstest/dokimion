package com.testquack.api.resources;

import com.testquack.api.utils.FilterUtils;
import com.testquack.beans.Entity;
import com.testquack.beans.Event;
import com.testquack.beans.Filter;
import io.swagger.annotations.ApiOperation;
import io.swagger.annotations.ApiParam;
import io.swagger.annotations.ApiResponse;
import io.swagger.annotations.ApiResponses;

import javax.servlet.http.HttpServletRequest;
import javax.ws.rs.*;
import javax.ws.rs.core.Response;
import java.util.Collection;

import static javax.ws.rs.core.Response.ok;

public abstract class BaseCrudResource<E extends Entity> extends BaseResource<E> {


    @Override
    protected Filter initFilter(HttpServletRequest hsr) {
        return FilterUtils.initFilter(request);
    }

    @GET
    @Path("/")
    public Collection<E> findFiltered(@ApiParam(value = "Project Id", required = true) @PathParam("projectId") String projectId) {
        return getService().findFiltered(getUserSession(), projectId, initFilter(request));
    }

    @GET
    @Path("/{id}")
    @ApiOperation(value = "Find entity by id", notes = "")
    @ApiResponses(value = {
            @ApiResponse(code = 400, message = "Entity not found"),
            @ApiResponse(code = 403, message = "Access denied to the entity"),
            @ApiResponse(code = 200, message = "Successful operation")
    })
    public E findOne(@ApiParam(value = "Project Id", required = true) @PathParam("projectId") String projectId,
            @ApiParam(value = "Entity Id", required = true) @PathParam("id") String id) {
System.out.println("BaseCrudResource::findOne() - projectId: " + projectId);
System.out.println("BaseCrudResource::findOne() - entity id: " + id);
        //return getService().findOne(getUserSession(), projectId, id);

        E entity = null;
        try {
           entity = getService().findOne(getUserSession(), projectId, id);
System.out.println("BaseCrudResource::findOne - entity: " + entity);
System.out.flush();
        } catch (Exception e) {
System.out.println("BaseCrudResource::findOne - exception: " + e);
System.out.flush();
	}

        return entity;
    }

    @POST
    @Path("/")
    @ApiOperation(value = "Create entity", notes = "")
    @ApiResponses(value = {
            @ApiResponse(code = 403, message = "Access denied to the entity"),
            @ApiResponse(code = 200, message = "Created entity")
    })
    public E create(@ApiParam(value = "Project Id", required = true) @PathParam("projectId") String projectId,
            @ApiParam(value = "Entity", required = true) E entity) {
System.out.println("BaseCrudResource::create() - entity: " + entity);
System.out.flush();
        //return getService().save(getUserSession(), projectId, entity);
System.out.println("BaseCrudResource::create - user session: " + getUserSession());
System.out.flush();
        E new_entity = null;
	try {
           new_entity = getService().save(getUserSession(), projectId, entity);
System.out.println("BaseCrudResource::create - new entity: " + new_entity);
System.out.flush();
        } catch (Exception e) {
System.out.println("BaseCrudResource::create - exception: " + e);
System.out.flush();
	}
        return new_entity;
    }

    @PUT
    @Path("/")
    @ApiOperation(value = "Update entity", notes = "")
    @ApiResponses(value = {
            @ApiResponse(code = 403, message = "Access denied to the entity"),
            @ApiResponse(code = 200, message = "Updated entity")
    })
    public E update(@ApiParam(value = "Project Id", required = true) @PathParam("projectId") String projectId,
            @ApiParam(value = "Entity", required = true) E entity) {
	try {
           return getService().save(getUserSession(), projectId, entity);
	} catch (Exception e) {
System.out.println("BaseCrudResource::update - exception: " + e);
System.out.flush();
           return (E)null;
	}
    }


    @DELETE
    @Path("/{id}")
    @ApiOperation(value = "Delete entity", notes = "")
    @ApiResponses(value = {
            @ApiResponse(code = 403, message = "Access denied to the entity"),
            @ApiResponse(code = 200, message = "Successful operation")
    })
    public Response delete(@ApiParam(value = "Project Id", required = true) @PathParam("projectId") String projectId,
            @ApiParam(value = "Id", required = true) @PathParam("id") String id) {

System.out.println("BaseCrudResource:delete - projectId, launchId: " + projectId + ", " + id);
System.out.flush();

        boolean rc = false;
	try {
           rc = getService().delete(getUserSession(), projectId, id);
	} catch (Exception e) {
System.out.println("BaseCrudResource::delete - exception: " + e);
System.out.flush();
	}

System.out.println("BaseCrudResource:delete - after call 1 to getService.delete, rc: " + rc);
System.out.flush();

        if (rc == true) {
           return ok().build();
	} else {
	   return Response.serverError().entity("BaseCrudResource::delete 1 error").build();
	}
    }

    @GET
    @Path("/count")
    @ApiOperation(value = "Count", notes = "")
    @ApiResponses(value = {
            @ApiResponse(code = 200, message = "Successful operation", response = long.class)
    })
    public long count(@ApiParam(value = "Project Id", required = true) @PathParam("projectId") String projectId){
        return getService().count(getUserSession(), projectId, initFilter(request));
    }

    @DELETE
    @Path("/")
    @ApiOperation(value = "Delete entity", notes = "")
    @ApiResponses(value = {
            @ApiResponse(code = 403, message = "Access denied to the entity"),
            @ApiResponse(code = 200, message = "Successful operation")
    })
    public Response delete(@ApiParam(value = "Project Id", required = true) @PathParam("projectId") String projectId) {

	    boolean rc = false;
	    try {
	       rc = getService().delete(getUserSession(), projectId, initFilter(request));
	    } catch (Exception e) {
System.out.println("BaseCrudResource::delete - exception: " + e);
System.out.flush();
	    }

System.out.println("BaseCrudResource:delete - after call 2 to getService.delete, rc: " + rc);
System.out.flush();
	    if (rc == true) {
	       return Response.ok().build();
	    } else {
	       return Response.serverError().entity("BaseCrudResource::delete 2 error").build();
	    }
    }

}
