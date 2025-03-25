package com.testquack.api.security;

import com.testquack.dal.aes;
import com.testquack.api.utils.MongoDBInterface;
import com.testquack.beans.Filter;
import com.testquack.beans.User;
import com.testquack.services.UserService;
import com.hazelcast.core.HazelcastInstanceNotActiveException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import ru.greatbit.whoru.auth.utils.HttpUtils;
import ru.greatbit.whoru.auth.Session;
import ru.greatbit.whoru.auth.Person;
import ru.greatbit.whoru.auth.RedirectResponse;
import ru.greatbit.whoru.auth.error.UnauthorizedException;
import ru.greatbit.whoru.auth.providers.BaseDbAuthProvider;
import ru.greatbit.utils.string.StringUtils;

import javax.servlet.http.Cookie;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.util.Collections;
import java.util.Set;
import java.util.stream.Collectors;
import java.security.NoSuchAlgorithmException;
import java.util.UUID;
import java.time.Instant;

import static java.lang.String.format;
import static java.util.Collections.emptySet;
import static org.apache.commons.lang3.StringUtils.isEmpty;
import static ru.greatbit.utils.string.StringUtils.emptyIfNull;
import static ru.greatbit.whoru.auth.utils.HttpUtils.isTokenAccessRequest;
import static ru.greatbit.whoru.auth.utils.AuthUtil.getMd5;
import static ru.greatbit.whoru.auth.utils.HttpUtils.TOKEN_KEY;

@Service
public class DbAuthProvider extends BaseDbAuthProvider {

    @Autowired
    private UserService userService;

    @Override
    protected Person getAdminPerson(String token) {
        return null;
    }

    @Override
    public Session authImpl(HttpServletRequest request, HttpServletResponse response) {
        if (isTokenAccessRequest(request)) {
            return authByToken(request, response);
        }

        try {
            Cookie sid = HttpUtils.findCookie(request, HttpUtils.SESSION_ID);
            if (sid == null || !sessionProvider.sessionExists(sid.getValue())
                    || !sessionProvider.getSessionById(sid.getValue()).getPerson().getLogin().equals(request.getParameter(PARAM_LOGIN))) {
                logger.info("No session found. Auth by login/password ip={}", HttpUtils.getRemoteAddr(request, IP_HEADER));
                return dbAuthByLoginPassword(request, response);
            } else {
                logger.info("Updating session for user with ip={}", HttpUtils.getRemoteAddr(request, IP_HEADER));
                response.addCookie(HttpUtils.createCookie(HttpUtils.SESSION_ID, sid.getValue(), authDomain, sessionTtl));
            }
            sendRedirect(request, response);
            return sessionProvider.getSessionById(sid.getValue());
        } catch (UnauthorizedException e){
System.out.println("DbAuthProvider::authImpl - throw UnauthorizedException 1");
System.out.flush();
            throw e;
        } catch (Exception e){
            logger.error("Can't authenticate user", e);
System.out.println("DbAuthProvider::authImpl - throw UnauthorizedException 2");
System.out.flush();
            throw new UnauthorizedException(e);
        }
    }

    private Session dbAuthByLoginPassword(HttpServletRequest request, HttpServletResponse response) throws NoSuchAlgorithmException {

        final String login = request.getParameter(PARAM_LOGIN);
        final String password = request.getParameter(PARAM_PASSWORD);
System.out.println("dbAuthByLoginPassword - login: " + login);
System.out.println("dbAuthByLoginPassword - password: " + password);
System.out.println("dbAuthByLoginPassword - this.adminPassword: " + this.adminPassword);
System.out.flush();

        Person person;
        final String secretKey = "al;jf;lda1_+_!!()!!!!";
        String decryptedAdminPassword = aes.decrypt(this.adminPassword, secretKey) ;

        if (login.equalsIgnoreCase(this.adminLogin) && getMd5(password, login).equals(getMd5(decryptedAdminPassword, this.adminLogin))) {
            person = getAdminPerson(login, password);
        } else {
            person = findPersonByLogin(login);
        }

System.out.println("dbAuthByLoginPassword - person.login: " + person.getLogin());
System.out.println("dbAuthByLoginPassword - person.isActive: " + person.isActive());
System.out.println("dbAuthByLoginPassword - getMD5: " + StringUtils.getMd5String(password + login));
System.out.flush();
        if (person!= null
                && login.equals(person.getLogin())
                && person.isActive()
		&& StringUtils.getMd5String(password + login).equals(person.getPassword())) {
                //&& getMd5(password, login).equals(person.getPassword())){
System.out.println("dbAuthByLoginPassword - person not null");
System.out.flush();

            return dbAuthAs(login, response, person);
        } else {
System.out.println("DbAuthProvider::dbAuthByLoginPassword - throw UnauthorizedException");
System.out.flush();
		throw new UnauthorizedException("Incorrect login or password");
	}
    }

    private Session dbAuthAs(String login, HttpServletResponse response, Person person) {
System.out.println("dbAuthAs - entry");
System.out.flush();
        if (person.getPasswordExpirationTime() > 0 && Instant.now().toEpochMilli() > person.getPasswordExpirationTime()){
            throw new UnauthorizedException(format("Temporary password has expired for user %s. Please contact administrator to set a new one.", person.getLogin()));
        }
        Session session = (Session) new Session().withId(UUID.randomUUID().toString()).withTimeout(sessionTtl).withName(login).withPerson(person);
        Session existedSession = null;
	try {
           existedSession = sessionProvider.getSessionIfExists(session);
	}
	catch (HazelcastInstanceNotActiveException he) {
           System.out.println("DbAuthProvider::dbAuthAs - hazelcast error: " + he);
	   System.out.flush();
	}

        if (existedSession == null) {
            sessionProvider.addSession(session);
            response.addCookie(HttpUtils.createCookie(HttpUtils.SESSION_ID, session.getId(), authDomain, sessionTtl));
System.out.println("dbAuthAs - new session created");
System.out.flush();
            return session;
        }
        else
            response.addCookie(HttpUtils.createCookie(HttpUtils.SESSION_ID, existedSession.getId(), authDomain, sessionTtl));

System.out.println("dbAuthAs - end");
System.out.flush();
        return existedSession;
    }


    @Override
    public Session doAuth(HttpServletRequest request, HttpServletResponse response){
        final String login = emptyIfNull(request.getParameter(PARAM_LOGIN));
        final String password = emptyIfNull(request.getParameter(PARAM_PASSWORD));
System.out.println("DbAuthProvider::doAuth - login: " + login);
System.out.flush();


        final String secretKey = "al;jf;lda1_+_!!()!!!!";
        String decryptedAdminPassword = aes.decrypt(adminPassword, secretKey) ;

        final String token = emptyIfNull(request.getHeader(TOKEN_KEY));
        if ((login.equals(adminLogin) && password.equals(decryptedAdminPassword)) || token.equals(adminToken)){
            Session adminSession = (Session) new Session().withIsAdmin(true).
                    withId(
                            isEmpty(token) ? UUID.randomUUID().toString() : token
                    ).
                    withLogin(adminLogin).withName(adminLogin).
                    withPerson(
                            new Person().withActive(true).withId(adminLogin).withFirstName(adminLogin)
                    );
            sessionProvider.addSession(adminSession);
            if (response != null){
                response.addCookie(HttpUtils.createCookie(HttpUtils.SESSION_ID, adminSession.getId(), authDomain, sessionTtl));
            }
            return adminSession;
        } else {
            Session session = authImpl(request, response);
            response.addCookie(HttpUtils.createCookie(HttpUtils.SESSION_ID, session.getId(), authDomain, sessionTtl));
            return session;
        }
    }

    @Override
    protected Person getAdminPerson(String login, String password) {

         final String secretKey = "al;jf;lda1_+_!!()!!!!";
         String decryptedAdminPassword = aes.decrypt(adminPassword, secretKey) ;

        if (!isEmpty(login) && !isEmpty(password) && login.equals(adminLogin) && password.equals(decryptedAdminPassword)){
            return new Person().withLogin(adminLogin).withFirstName("admin");
        }
System.out.println("DbAuthProvider::getAdminPerson - throw UnauthorizedException");
System.out.flush();
        throw new UnauthorizedException();
    }

    @Override
    protected Person findPersonByApiToken(String token) {
        if (!isEmpty(token) && token.equals(adminToken)){
            return new Person().withLogin(adminLogin).withFirstName("admin");
        }
System.out.println("DbAuthProvider::findPersonByApiToken - throw UnauthorizedException");
System.out.flush();
        throw new UnauthorizedException();
    }

    @Override
    protected Person findPersonByLogin(String login) {

        Person person = convertUser(userService.findOne(null, new Filter().withField("login", login)));
        System.out.println("DbAuthProvider.findPersonByLogin - person: " + person);
        System.out.flush();

        return convertUser(userService.findOne(null, new Filter().withField("login", login)));
    }

    @Override
    public Set<String> suggestGroups(HttpServletRequest request, String literal) {
        return emptySet();
    }

    @Override
    public Set<String> getAllUsers(HttpServletRequest request) {
        return userService.findAll().stream().
                map(User::getLogin).
                collect(Collectors.toSet()); 
    }

    @Override
    public Set<String> suggestUser(HttpServletRequest request, String literal) {
        if (isEmpty(literal)) return emptySet();
        return userService.suggestUsers(null, literal).stream().
                map(user -> format("%s:%s %s", user.getId(), user.getFirstName(), user.getLastName())).
                collect(Collectors.toSet());
    }

    @Override
    public RedirectResponse redirectChangePasswordTo(HttpServletRequest request) {
        String login = emptyIfNull(request.getParameter("login"));
        return new RedirectResponse(changePasswordUrl + "/" + login, "retpath", false);
    }

    @Override
    public RedirectResponse redirectNotAuthTo(HttpServletRequest request) {
        return new RedirectResponse("/login", "retpath", false);
    }

    private Person convertUser(User user){

        System.out.println("convertUser");
        System.out.flush();

        MongoDBInterface mongoDBInterface = new MongoDBInterface();
        mongoDBInterface.setMongoDBProperties(userService.getMongoReplicaSet(),
                                              userService.getMongoUsername(),
                                              userService.getMongoPassword(),
                                              userService.getMongoDBName());

        return new Person().withFirstName(user.getFirstName()).
                withLastName(user.getLastName()).
                withLogin(user.getLogin()).
                withActive(true).
                withDefaultPassword(user.isPasswordChangeRequired()).
                withPassword(user.getPassword()).
                withRoles(user.getRole());
    }
}
