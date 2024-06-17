package com.testquack.api.resources;

import com.testquack.dal.Logger;
import com.testquack.api.utils.APIValidation;
import com.testquack.api.utils.PasswordGeneration;
import com.testquack.api.utils.MongoDBInterface;
import com.testquack.api.utils.SendEmail;
import com.testquack.api.utils.FilterUtils;
import com.testquack.beans.ChangePasswordRequest;
import com.testquack.beans.Filter;
import com.testquack.beans.User;
import com.testquack.services.BaseService;
import com.testquack.services.UserService;
import io.swagger.annotations.ApiOperation;
import io.swagger.annotations.ApiResponse;
import io.swagger.annotations.ApiResponses;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import ru.greatbit.utils.string.StringUtils;
import ru.greatbit.whoru.auth.utils.HttpUtils;
import ru.greatbit.whoru.auth.AuthProvider;
import ru.greatbit.whoru.auth.Person;
import ru.greatbit.whoru.auth.RedirectResponse;
import ru.greatbit.whoru.auth.Session;
import ru.greatbit.whoru.auth.SessionProvider;

import org.json.*;
import javax.servlet.http.HttpServletRequest;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.*;
import javax.ws.rs.core.Response;
import javax.servlet.http.Cookie;
import java.io.IOException;
import java.util.Collection;
import java.util.Set;
import java.util.List;
import java.util.ArrayList;
import java.util.Random;
import java.net.URI;
import java.net.URISyntaxException;
import java.security.NoSuchAlgorithmException;

@Path("/user")
public class UserResource extends BaseResource<User> {

    @Autowired
    AuthProvider authProvider;

    @Autowired
    SessionProvider sessionProvider;

    @Autowired
    private UserService service;

    @Value("${quack.ui.url}")
    private String baseUiUrl;

    @Override
    protected Filter initFilter(HttpServletRequest hsr) {
        return FilterUtils.initFilter(request);
    }

    @Override
    protected BaseService<User> getService() {
Logger.info("UserResource::getService - service: " + service);
        return service;
    }

    @GET
    @Path("/{login}")
    public User getUser(@PathParam("login") String login) {
Logger.info("UserResource::getUser - login: " + login);

        if (APIValidation.checkLoginId(getService().getMongoReplicaSet(),
            getService().getMongoUsername(),
            getService().getMongoPassword(),
            getService().getMongoDBName(),
            login) == false) {

            Logger.info("UserResource::getUser : checkLoginId returned FALSE - did NOT find login");

            User user = null;
            return user;
        }

        return service.findOne(getSession(), null, login);
    }


    @POST
    @Path("/delete")
    public Response delete(@QueryParam("login") String login) {
Logger.info("UserResource::delete - login: " + login);

        User user = getUser(login);
        service.delete(getSession(), null, user.getId());

        return Response.ok().build();
    }


    @POST
    @Path("/forgot_password")
    public Response getEmail(@QueryParam("login") String login) {

      Logger.info("getEmail - login: " + login);

       if (APIValidation.checkLoginId(getService().getMongoReplicaSet(),
            getService().getMongoUsername(),
            getService().getMongoPassword(),
            getService().getMongoDBName(),
            login) == false) {

            Logger.info("UserResource::getEmail: checkLoginId returned FALSE - did NOT find login");

            Response resp = null;
            return resp;
       }

       MongoDBInterface mongoDBInterface = new MongoDBInterface();
       mongoDBInterface.setMongoDBProperties(getService().getMongoReplicaSet(),
                                              getService().getMongoUsername(),
                                              getService().getMongoPassword(),
                                              getService().getMongoDBName());

       String email = mongoDBInterface.getEmail(login);

       Logger.info("Fetched mongodb emails");

       JSONObject jsonObj = new JSONObject();
       jsonObj.put("email", email);

       boolean doneGeneratingPassword = true;
       String password="";
       int loopCounter = 0;
       do {

          loopCounter += 1;

	  password = PasswordGeneration.generatePassword();

	  String uriStr = "http://dokimion.com/" + password;
	  try {
	    URI uri = new URI(uriStr);
	  }
	  catch (URISyntaxException e)
	  {
            doneGeneratingPassword = false;
	    Logger.info("URI Syntax exception for URI: " + uriStr);
	  }
       } while (doneGeneratingPassword == true || loopCounter > 3);
  


       SendEmail sendEmailObj = new SendEmail();
       sendEmailObj.send(email, password);

       Logger.info("Sent email to: " + email);

       String encryptedPass = "";
       try {
	 encryptedPass = StringUtils.getMd5String(password + login);
       } catch (NoSuchAlgorithmException e) {
         throw new RuntimeException(e);
       }
       mongoDBInterface.updatePassword(login, encryptedPass);

       return Response.ok(jsonObj.toString(), MediaType.APPLICATION_JSON).build();
    }

    @POST
    @Path("/")
    public User createUser(User user){

        
	Logger.info("UserResource::createUser - " + user);

        Logger.info("UserResource::createUser: session - " + getSession());

        if (APIValidation.checkLoginId(getService().getMongoReplicaSet(),
            getService().getMongoUsername(),
            getService().getMongoPassword(),
            getService().getMongoDBName(),
            user.getLogin()) == true) {

            Logger.info("UserResource::createUser: checkLoginId returned FALSE - did NOT find login");

            User user1 = null;
            return user1;
        }

        return service.save(getSession(), null, user);
    }

    @PUT
    @Path("/")
    public User updateUser(User user){

        if (APIValidation.checkLoginId(getService().getMongoReplicaSet(),
            getService().getMongoUsername(),
            getService().getMongoPassword(),
            getService().getMongoDBName(),
            user.getLogin()) == false) {

            Logger.info("UserResource::updateUser: checkLoginId returned FALSE - did NOT find login");

            User user1 = null;
            return user1;
        }

        return service.save(getSession(), null, user);
    }

    @GET
    @Path("/")
    public Collection<User> findFiltered() {
        //return getService().findFiltered(getSession(), null, initFilter(request));
        Collection<User> collUsers = getService().findFiltered(getSession(), null, initFilter(request));

        for (User user : collUsers) {
           Logger.info("UserResource.findFiltered - user: " + user);
        }

        return collUsers;
    }

    @GET
    @Path("/count")
    @ApiOperation(value = "Count", notes = "")
    @ApiResponses(value = {
            @ApiResponse(code = 200, message = "Successful operation", response = long.class)
    })
    public long count(){
        return getService().count(getSession(), null, initFilter(request));
    }

    @GET
    @Path("/session")
    public Session getSession() {
        return authProvider.getSession(request);
    }

    @POST
    @Path("/login")
    public Session login(@QueryParam("login") String login,
                         @QueryParam("password") String password) {
        Session session = authProvider.doAuth(request, response);
Logger.info("UserResource::login - session: " + session);
Logger.info("UserResource::login - login: " + login);

        if (APIValidation.checkLoginId(getService().getMongoReplicaSet(),
            getService().getMongoUsername(),
            getService().getMongoPassword(),
            getService().getMongoDBName(),
            login) == false) {

            Logger.info("UserResource::login: checkLoginId returned FALSE - did NOT find login");

            Session session1 = null;
            return session1;
        }

        Person person = session.getPerson();
        MongoDBInterface mongoDBInterface = new MongoDBInterface();
        mongoDBInterface.setMongoDBProperties(getService().getMongoReplicaSet(),
                                              getService().getMongoUsername(),
                                              getService().getMongoPassword(),
                                              getService().getMongoDBName());

        String thisRole = mongoDBInterface.getRole(login);

Logger.info("UserResource::login - role: " + thisRole);

        List<String> roles = new ArrayList<String>();
        roles.add(thisRole);
        person.setRoles(roles);
        session.setPerson(person);

	if (service.setLocked(session, true) == false) {
	   Logger.info("UserResource::login - setLocked failed");
	}

Logger.info("UserResource::login - end of setLocked call");
        return session;
        //return authProvider.doAuth(request, response);
    }


    @GET
    @Path("/auth")
    public Session login() throws IOException {
        return authProvider.doAuth(request, response);
    }

    @GET
    @Path("/login-redirect")
    public RedirectResponse getLoginRedirect(){
        return authProvider.redirectNotAuthTo(request);
    }

    @GET
    @Path("/create-redirect")
    public RedirectResponse getCreateUserRedirect(){
        return authProvider.redirectCreateUserTo(request);
    }

    @GET
    @Path("/all-redirect")
    public RedirectResponse getAllUsersRedirect(){
        return authProvider.redirectViewAllUsersTo(request);
    }

    @POST
    @Path("/change-password")
    public Response changePassword(ChangePasswordRequest changePasswordRequest){

        Session session = getSession();
        String login = changePasswordRequest.getLogin() == null ? getSession().getPerson().getLogin() : changePasswordRequest.getLogin();

        if (APIValidation.checkLoginId(getService().getMongoReplicaSet(),
            getService().getMongoUsername(),
            getService().getMongoPassword(),
            getService().getMongoDBName(),
            login) == false) {

            Logger.info("UserResource::changePassword: checkLoginId returned FALSE - did NOT find login");

            Response resp = null;
            return resp;
        }

        service.changePassword(session, login, changePasswordRequest.getOldPassword(), changePasswordRequest.getNewPassword());
        session.getPerson().setDefaultPassword(false);
        sessionProvider.replaceSession(session);

        return Response.ok().build();
    }

    @GET
    @Path("/change-password-redirect")
    public RedirectResponse changePasswordRedirect(){
        return authProvider.redirectChangePasswordTo(request);
    }


    @DELETE
    @Path("/logout")
    public Response logout() {

	Cookie sid = HttpUtils.findCookie(request, HttpUtils.SESSION_ID);
Logger.info("UserResource::logout - sid: " + sid);
        Session session = sessionProvider.getSessionById(sid.getValue());

Logger.info("UserResource::logout - login: " + session.getLogin());

	if (service.setLocked(session, false) == false) {
	   Logger.info("UserResource::logout - setLocked false failed");
	}

        authProvider.doLogout(request, response);
Logger.info("UserResource::logout - after authProvider.doLogout call");

        return Response.ok().build();
    }

    @GET
    @Path("/groups")
    public Set<String> getGroups(){
        return authProvider.getAllGroups(request);
    }

    @GET
    @Path("/groups/suggest")
    public Set<String> suggestGroups(@QueryParam("literal") String literal) {
        return authProvider.suggestGroups(request, literal);
    }

    @GET
    @Path("/users")
    public Set<String> getUsers(){
        Set<String> users = authProvider.getAllUsers(request);
Logger.info("UserResource::getUsers");
for (String user : users) {
Logger.info("user: " + user);
}
        return users;
    }

    @GET
    @Path("/users/suggest")
    public Set<String> suggestUsers(@QueryParam("literal") String literal) {
        return authProvider.suggestUser(request, literal);
    }

    @POST
    @Path("/changeorg/{orgId}")
    public Session login(@PathParam("orgId") String organizationId) {
        Session session = service.changeOrganization(getSession(), organizationId);
        sessionProvider.replaceSession(session);
        return session;
    }

}
