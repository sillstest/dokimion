package com.testquack.api.resources;

import com.testquack.dal.DokimionLogger;
import com.testquack.beans.Filter;
import com.testquack.beans.LauncherConfigDescriptor;
import com.testquack.beans.Project;
import com.testquack.launcher.Launcher;
import com.testquack.services.BaseService;
import com.testquack.services.LaunchService;
import com.testquack.api.utils.FilterUtils;
import org.springframework.beans.factory.annotation.Autowired;
import ru.greatbit.plow.PluginsContainer;
import ru.greatbit.whoru.jaxrs.Authenticable;

import javax.servlet.http.HttpServletRequest;
import javax.ws.rs.GET;
import javax.ws.rs.DELETE;
import javax.ws.rs.Path;
import javax.ws.rs.PathParam;
import javax.ws.rs.core.Response;
import java.util.List;
import java.util.Set;

import io.swagger.annotations.ApiOperation;
import io.swagger.annotations.ApiParam;
import io.swagger.annotations.ApiResponse;
import io.swagger.annotations.ApiResponses;

import org.springframework.beans.factory.annotation.Autowired;
import ru.greatbit.plow.PluginsContainer;
import ru.greatbit.whoru.jaxrs.Authenticable;

import static java.util.stream.Collectors.toList;

@Authenticable
@Path("/launcher")
public class LauncherResource extends BaseResource<Project> {


    @Autowired
    private LaunchService service;

    @Autowired
    private PluginsContainer pluginsContainer;

    @GET
    @Path("/")
    public Set<String> getLaunchersList() {
        return pluginsContainer.getPlugins(Launcher.class).keySet();
    }

    @GET
    @Path("/descriptors")
    public List<LauncherConfigDescriptor> getLaunchersDescriptors() {
        return pluginsContainer.getPlugins(Launcher.class).values().stream().map(Launcher::getConfigDescriptor).collect(toList());
    }


    @GET
    @Path("/{id}/descriptor")
    public LauncherConfigDescriptor getLaunchersDescriptor(@PathParam("id") String launcherId) {
        return pluginsContainer.getPlugins(Launcher.class).get(launcherId).getConfigDescriptor();
    }

    @Override
    protected Filter initFilter(HttpServletRequest hsr) {
        throw new UnsupportedOperationException();
    }

    @Override
    protected BaseService<Project> getService() {
        throw new UnsupportedOperationException();
    }

    @DELETE
    @Path("/{projectId}/{launchId}")
    public Response delete(@PathParam("projectId") String projectId,
                           @PathParam("launchId") String launchId) {

DokimionLogger.info("LauncherResource - delete: projectId, launchId: " + projectId + ", " + launchId);

       service.delete(getUserSession(), projectId, launchId);

DokimionLogger.info("LauncherResource - delete: - after service.delete call");

        return Response.ok().build();
    }

}
