package com.testquack.api.resources;

import com.testquack.api.utils.APIValidation;
import com.testquack.api.utils.PasswordGeneration;
import com.testquack.api.utils.MongoDBInterface;
import com.testquack.api.utils.SendEmail;
import com.testquack.api.utils.FilterUtils;
import com.testquack.beans.ChangeProfileRequest;
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

import java.net.URL;
import javax.net.ssl.HttpsURLConnection;
import java.time.Duration;
import java.time.Instant;
import org.json.*;
import javax.servlet.http.HttpServletRequest;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.*;
import javax.ws.rs.core.Response;
import javax.servlet.http.Cookie;
import java.io.IOException;
import java.io.DataOutputStream;
import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.util.Collection;
import java.util.Set;
import java.util.List;
import java.util.ArrayList;
import java.util.Random;
import java.util.UUID;
import java.net.URI;
import java.net.URISyntaxException;
import java.security.NoSuchAlgorithmException;


@Path("/user")
public class UserResource extends BaseResource<User> {

    public static final String url = "https://www.google.com/recaptcha/api/siteverify";
    public static final String secret = "6Lf6e6wqAAAAALQWlmjZhCLEE9Oy4O9q7sO1dg6Z";
    private final static String USER_AGENT = "Mozilla/5.0";

    @Autowired
    AuthProvider authProvider;

    @Autowired
    SessionProvider sessionProvider;

    @Autowired
    private UserService service;

    @Value("${quack.ui.url}")
    private String baseUiUrl;

    private static MongoDBInterface s_mongoDBInterface;

    @POST
    @Path("/init")
    public Response init() {

       Duration deltaTime = Duration.ZERO;
       Instant beginTime = Instant.now();

       s_mongoDBInterface = new MongoDBInterface();
       s_mongoDBInterface.setMongoDBProperties(getService().getMongoReplicaSet(),
                                              getService().getMongoUsername(),
                                              getService().getMongoPassword(),
                                              getService().getMongoDBName());

       deltaTime = Duration.between(beginTime, Instant.now());

       System.out.println("UserResource::init - deltaTime to get mongoClient: " + deltaTime);
       System.out.flush();

       return Response.ok().build();

    }


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

        if (APIValidation.checkLoginId(getService().getMongoReplicaSet(),
            getService().getMongoUsername(),
            getService().getMongoPassword(),
            getService().getMongoDBName(),
            login) == false) {

            System.out.println("UserResource::getUser : checkLoginId returned FALSE - did NOT find login");
            System.out.flush();

            User user = null;
            return user;
        }

        return service.findOne(getSession(), null, login);
    }


    @POST
    @Path("/delete")
    public Response delete(@QueryParam("login") String login) {
System.out.println("UserResource::delete - login: " + login);
System.out.flush();

        User user = getUser(login);
	try {
           boolean rc = service.delete(getSession(), null, user.getId());
System.out.println("UserResource::delete - rc: " + rc);
	   if (rc == true) {
              return Response.ok().build();
	   } else {
              return Response.serverError().entity("UserResource::delete error").build();
	   }
	} catch(Exception e) {
           return Response.serverError().entity("UserResource::delete exception").build();
	}
    }

    @POST
    @Path("/forgot_password")
    public Response sendEmail(@QueryParam("login") String login,
                              @QueryParam("recaptcha") String recaptcha) {

       System.out.println("sendEmail - login: " + login);
       System.out.println("sendEmail - recaptcha1: " + recaptcha);
       System.out.flush();

       if (APIValidation.checkLoginId(getService().getMongoReplicaSet(),
            getService().getMongoUsername(),
            getService().getMongoPassword(),
            getService().getMongoDBName(),
            login) == false) {

            System.out.println("UserResource::getEmail: checkLoginId returned FALSE - did NOT find login");
            System.out.flush();

            return Response.serverError().entity("sendEmail - APIValidation error").build();
       }
       

       if (sendVerifyRecaptchaMessage(recaptcha) == false) {
            return Response.serverError().entity("sendEmail - Invalid ReCaptcha").build();
       }


       Duration deltaTime = Duration.ZERO;
       Instant beginTime = Instant.now();

       deltaTime = Duration.between(beginTime, Instant.now());

       System.out.println("UserResource::sendEmail - deltaTime to get mongoClient: " + deltaTime);
       System.out.flush();

       beginTime = Instant.now();
       String email = s_mongoDBInterface.getEmail(login);
       deltaTime = Duration.between(beginTime, Instant.now());

       System.out.println("UserResource::sendEmail - deltaTime to getEmail: " + deltaTime);
       System.out.flush();


       System.out.println("Fetched mongodb emails");
       System.out.flush();

       JSONObject jsonObj = new JSONObject();
       jsonObj.put("email", email);

       String newPassword = PasswordGeneration.generatePassword();

       // create new session
       beginTime = Instant.now();
       Person person = s_mongoDBInterface.getPerson(login);
       deltaTime = Duration.between(beginTime, Instant.now());

       System.out.println("UserResource::sendEmail - deltaTime to getPerson: " + deltaTime);
       System.out.flush();

       System.out.println("getPerson() -  " + person);
       System.out.flush();

       beginTime = Instant.now();
       if (service.changeProfile(login, newPassword,
			         "", "", "", "") == false) {
System.out.println("UserResource::sendEmail - fail in service.changeProfile");
System.out.flush();
          return Response.serverError().entity("ChangeProfile Failed").build();
       }

       deltaTime = Duration.between(beginTime, Instant.now());
       System.out.println("UserResource::sendEmail - deltaTime to changeProfile: " + deltaTime);
       System.out.flush();


       beginTime = Instant.now();
       SendEmail.send(email, newPassword);
       deltaTime = Duration.between(beginTime, Instant.now());
       System.out.println("UserResource::sendEmail - deltaTime to sendEmailAsync: " + deltaTime);
       System.out.flush();

       System.out.println("UserResource::sendEmail - forgot_password - DONE");
       System.out.flush();


       return Response.ok().build();

    }

    @POST
    @Path("/")
    public User createUser(User user){

        
	System.out.println("UserResource::createUser - " + user);
	System.out.flush();

        System.out.println("UserResource::createUser: session - " + getSession());
        System.out.flush();

        if (APIValidation.checkLoginId(getService().getMongoReplicaSet(),
            getService().getMongoUsername(),
            getService().getMongoPassword(),
            getService().getMongoDBName(),
            user.getLogin()) == false) {

            System.out.println("UserResource::createUser: checkLoginId returned FALSE - did NOT find login");
            System.out.flush();

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

            System.out.println("UserResource::updateUser: checkLoginId returned FALSE - did NOT find login");
            System.out.flush();

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
                         @QueryParam("password") String password,
                         @QueryParam("recaptcha") String recaptcha) {
System.out.println("UserResource::login - login: " + login);
System.out.println("UserResource::login - password: " + password);
System.out.println("UserResource::login - recaptcha: " + recaptcha);
System.out.flush();
    Session session = authProvider.doAuth(request, response);

	if (session == null) {
	   System.out.println("UserResource::login - failed");
	   System.out.flush();
	   return null;
	}
System.out.println("session ok returned from doAuth");
System.out.flush();

    if (sendVerifyRecaptchaMessage(recaptcha) == false) {
        return null;
    }


System.out.println("UserResource::login - session: " + session);
System.out.flush();

    Person person = session.getPerson();
    s_mongoDBInterface.setMongoDBProperties(getService().getMongoReplicaSet(),
                                            getService().getMongoUsername(),
                                            getService().getMongoPassword(),
                                            getService().getMongoDBName());

    String thisRole = s_mongoDBInterface.getRole(login);

    String mongopass = s_mongoDBInterface.getPassword(login);

System.out.println("UserResource::login - role: " + thisRole);
System.out.println("UserResource::login - mongo password: " + mongopass);
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
    @Path("/change-profile")
    public Response changeProfile(ChangeProfileRequest changeProfileRequest){

System.out.println("UserResource::changeProfile - newPassword: " + changeProfileRequest.getNewPassword());
System.out.println("UserResource::changeProfile - login: " + changeProfileRequest.getLogin());
System.out.println("UserResource::changeProfile - firstName: " + changeProfileRequest.getFirstName());
System.out.println("UserResource::changeProfile - lastName: " + changeProfileRequest.getLastName());
System.out.println("UserResource::changeProfile - email: " + changeProfileRequest.getEmail());
System.out.println("UserResource::changeProfile - role: " + changeProfileRequest.getRole());
System.out.flush();

System.out.println("UserResource::changeProfile - oldpass, newpass: " + changeProfileRequest.getOldPassword() + ", " + changeProfileRequest.getNewPassword());

System.out.flush();

       Session session = getSession();
       String login = changeProfileRequest.getLogin() == null ? getSession().getPerson().getLogin() : changeProfileRequest.getLogin();

       if (service.changeProfile(session, login, 
			         changeProfileRequest.getNewPassword(), 
				 changeProfileRequest.getFirstName(), 
				 changeProfileRequest.getLastName(),
				 changeProfileRequest.getEmail(),
				 changeProfileRequest.getRole()
			       ) == false) {
System.out.println("UserResource::changeProfile - fail in service.changeProfile");
System.out.flush();
          return Response.serverError().entity("ChangeProfile Failed").build();
       }

System.out.println("UserResource::changeProfile - after service.changeProfile");
System.out.flush();

       session.getPerson().setDefaultPassword(false);
       sessionProvider.replaceSession(session);

       return Response.ok().build();
    }

    @GET
    @Path("/change-profile-redirect")
    public RedirectResponse changeProfileRedirect(){
        return authProvider.redirectChangePasswordTo(request);
    }

    @DELETE
    @Path("/logout")
    public Response logout() {

	Cookie sid = HttpUtils.findCookie(request, HttpUtils.SESSION_ID);

        if (sid == null) {
System.out.println("UserResource::logout - sid: " + sid);
System.out.flush();
	        return null;
	    }

        Session session = sessionProvider.getSessionById(sid.getValue());

System.out.println("UserResource::logout - session: " + session);
System.out.flush();

	if (service.setLocked(session, false) == false) {
	   System.out.println("UserResource::logout - setLocked false failed");
	   System.out.flush();
	}

       s_mongoDBInterface.setMongoDBProperties(getService().getMongoReplicaSet(),
                                              getService().getMongoUsername(),
                                              getService().getMongoPassword(),
                                              getService().getMongoDBName());

       String pass = s_mongoDBInterface.getPassword(session.getLogin());
System.out.println("logout - before doLogout mongo pass: " + pass);
System.out.flush();

        authProvider.doLogout(request, response);

        pass = s_mongoDBInterface.getPassword(session.getLogin());
System.out.println("logout - after doLogout mongo pass: " + pass);
System.out.flush();
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

    private boolean sendVerifyRecaptchaMessage(String recaptcha)
    {
    
        try {
            URL obj = new URL(url);
            HttpsURLConnection con = (HttpsURLConnection) obj.openConnection();

            // add reuqest header
            con.setRequestMethod("POST");
            con.setRequestProperty("User-Agent", USER_AGENT);
            con.setRequestProperty("Accept-Language", "en-US,en;q=0.5");

            String postParams = "secret=" + secret + "&response=" + recaptcha;

            // Send post request
            con.setDoOutput(true);
            DataOutputStream wr = new DataOutputStream(con.getOutputStream());
            wr.writeBytes(postParams);
            wr.flush();
            wr.close();

            int responseCode = con.getResponseCode();
            System.out.println("\nSending 'POST' request to URL : " + url);
            System.out.println("Post parameters : " + postParams);
            System.out.println("Response Code : " + responseCode);

            if (responseCode != 200) {
                System.out.println("Recaptcha Verification Failed");
                return false;
            }


            
        }catch(Exception e){
            e.printStackTrace();
        }

        return true;
    }

}
