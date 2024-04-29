package com.testquack.api.resources;

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
System.out.println("UserResource::getService - service: " + service);
System.out.flush();
        return service;
    }

    @GET
    @Path("/{login}")
    public User getUser(@PathParam("login") String login) {
System.out.println("UserResource::getUser - login: " + login);
System.out.flush();
/*
        if (APIValidation.checkLoginId(getService().getMongoReplicaSet(),
            getService().getMongoUsername(),
            getService().getMongoPassword(),
            getService().getMongoDBName(),
            login) == false) {

            System.out.println("UserResource::getUser : checkLoginId returned FALSE - did NOT find project id");
            System.out.flush();

            User user = null;
            return user;
        }
*/
        return service.findOne(getSession(), null, login);
    }


    @POST
    @Path("/delete")
    public Response delete(@QueryParam("login") String login) {
System.out.println("UserResource::delete - login: " + login);
System.out.flush();

/*
        if (APIValidation.checkLoginId(getService().getMongoReplicaSet(),
            getService().getMongoUsername(),
            getService().getMongoPassword(),
            getService().getMongoDBName(),
            login) == false) {

            System.out.println("UserResource::getUser: checkLoginId returned FALSE - did NOT find project id");
            System.out.flush();

            Response resp = null;
            return resp;
        }
*/

        User user = getUser(login);
        service.delete(getSession(), null, user.getId());

        return Response.ok().build();
    }


    @POST
    @Path("/forgot_password")
    public Response getEmail(@QueryParam("login") String login) {

	    System.out.println("getEmail - login: " + login);
	    System.out.flush();
/*
        if (APIValidation.checkLoginId(getService().getMongoReplicaSet(),
            getService().getMongoUsername(),
            getService().getMongoPassword(),
            getService().getMongoDBName(),
            login) == false) {

            System.out.println("UserResource::getEmail: checkLoginId returned FALSE - did NOT find project id");
            System.out.flush();

            Response resp = null;
            return resp;
        }
*/
	    MongoDBInterface mongoDBInterface = new MongoDBInterface();
        mongoDBInterface.setMongoDBProperties(getService().getMongoReplicaSet(),
                                              getService().getMongoUsername(),
                                              getService().getMongoPassword(),
                                              getService().getMongoDBName());

	    String email = mongoDBInterface.getEmail(login);

	    System.out.println("Fetched mongodb emails");
	    System.out.flush();

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
	            System.out.println("URI Syntax exception for URI: " + uriStr);
	            System.out.flush();
	        }
	    } while (doneGeneratingPassword == true || loopCounter > 3);


	    SendEmail sendEmailObj = new SendEmail();
	    sendEmailObj.send(email, password);

	    System.out.println("Sent email to: " + email);
	    System.out.flush();

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

        
	    System.out.println("UserResource::createUser - " + user);
	    System.out.flush();

        System.out.println("UserResource::createUser: session - " + getSession());
        System.out.flush();
/*
        if (APIValidation.checkLoginId(getService().getMongoReplicaSet(),
            getService().getMongoUsername(),
            getService().getMongoPassword(),
            getService().getMongoDBName(),
            user.getLogin()) == true) {

            System.out.println("UserResource::createUser: checkLoginId returned FALSE - did NOT find project id");
            System.out.flush();

            User user1 = null;
            return user1;
        }
*/
        return service.save(getSession(), null, user);
    }

    @PUT
    @Path("/")
    public User updateUser(User user){

/*
        if (APIValidation.checkLoginId(getService().getMongoReplicaSet(),
            getService().getMongoUsername(),
            getService().getMongoPassword(),
            getService().getMongoDBName(),
            user.getLogin()) == false) {

            System.out.println("UserResource::updateUser: checkLoginId returned FALSE - did NOT find project id");
            System.out.flush();

            User user1 = null;
            return user1;
        }
*/
        return service.save(getSession(), null, user);
    }

    @GET
    @Path("/")
    public Collection<User> findFiltered() {
        //return getService().findFiltered(getSession(), null, initFilter(request));
        Collection<User> collUsers = getService().findFiltered(getSession(), null, initFilter(request));

        for (User user : collUsers) {
           System.out.println("UserResource.findFiltered - user: " + user);
           System.out.flush();
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
System.out.println("UserResource.login - session: " + session);
System.out.println("UserResource.login - login: " + login);
System.out.flush();

/*
        if (APIValidation.checkLoginId(getService().getMongoReplicaSet(),
            getService().getMongoUsername(),
            getService().getMongoPassword(),
            getService().getMongoDBName(),
            login) == false) {

            System.out.println("UserResource::login: checkLoginId returned FALSE - did NOT find project id");
            System.out.flush();

            Session session1 = null;
            return session1;
        }
*/
        Person person = session.getPerson();
        MongoDBInterface mongoDBInterface = new MongoDBInterface();
        mongoDBInterface.setMongoDBProperties(getService().getMongoReplicaSet(),
                                              getService().getMongoUsername(),
                                              getService().getMongoPassword(),
                                              getService().getMongoDBName());

        String thisRole = mongoDBInterface.getRole(login);

System.out.println("UserResource::login - role: " + thisRole);
System.out.flush();

        List<String> roles = new ArrayList<String>();
        roles.add(thisRole);
        person.setRoles(roles);
        session.setPerson(person);

	if (service.setLocked(session, true) == false) {
	   System.out.println("UserResource::login - setLocked failed");
	   System.out.flush();
	}

System.out.println("UserResource::login - end of setLocked call");
System.out.flush();
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

/*
        if (APIValidation.checkLoginId(getService().getMongoReplicaSet(),
            getService().getMongoUsername(),
            getService().getMongoPassword(),
            getService().getMongoDBName(),
            login) == false) {

            System.out.println("UserResource::changePassword: checkLoginId returned FALSE - did NOT find project id");
            System.out.flush();

            Response resp = null;
            return resp;
        }
*/
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
System.out.println("UserResource::logout - sid: " + sid);
System.out.flush();
        Session session = sessionProvider.getSessionById(sid.getValue());

System.out.println("UserResource::logout - session: " + session);
System.out.flush();

	    if (service.setLocked(session, false) == false) {
	        System.out.println("UserResource::logout - setLocked false failed");
	        System.out.flush();
	    }

        authProvider.doLogout(request, response);
System.out.println("UserResource::logout - after authProvider.doLogout call");
System.out.flush();

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
System.out.println("UserResource::getUsers");
for (String user : users) {
System.out.println("user: " + user);
System.out.flush();
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
