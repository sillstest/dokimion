package com.testquack.api.security;

import com.testquack.dal.aes;
import com.testquack.api.utils.MongoDBInterface;
import com.testquack.beans.Filter;
import com.testquack.beans.User;
import com.testquack.services.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import ru.greatbit.whoru.auth.utils.HttpUtils;
import ru.greatbit.whoru.auth.Session;
import ru.greatbit.whoru.auth.Person;
import ru.greatbit.whoru.auth.RedirectResponse;
import ru.greatbit.whoru.auth.error.UnauthorizedException;
import ru.greatbit.whoru.auth.providers.BaseDbAuthProvider;

import javax.servlet.http.Cookie;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.util.Collections;
import java.util.Set;
import java.util.stream.Collectors;
import java.security.NoSuchAlgorithmException;
import java.util.UUID;

import static java.lang.String.format;
import static java.util.Collections.emptySet;
import static org.apache.commons.lang3.StringUtils.isEmpty;
import static ru.greatbit.utils.string.StringUtils.emptyIfNull;
import static ru.greatbit.whoru.auth.utils.HttpUtils.isTokenAccessRequest;
import static ru.greatbit.whoru.auth.utils.AuthUtil.getMd5;

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
            throw e;
        } catch (Exception e){
            logger.error("Can't authenticate user", e);
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

System.out.println("dbAuthByLoginPassword - decrypted Admin password: " + decryptedAdminPassword);
System.out.flush();

        if (login.equalsIgnoreCase(this.adminLogin) && getMd5(password, login).equals(getMd5(decryptedAdminPassword, this.adminLogin))) {
            person = getAdminPerson(login, password);
        } else {
            person = findPersonByLogin(login);
        }

        if (person!= null
                && login.equals(person.getLogin())
                && person.isActive()
                && getMd5(password, login).equals(person.getPassword())){

            return dbAuthAs(login, response, person);
        } else throw new UnauthorizedException("Incorrect login or password");
    }

    private Session dbAuthAs(String login, HttpServletResponse response, Person person) {
        if (person.getPasswordExpirationTime() > 0 && System.currentTimeMillis() > person.getPasswordExpirationTime()){
            throw new UnauthorizedException(format("Temporary password has expired for user %s. Please contact administrator to set a new one.", person.getLogin()));
        }
        Session session = (Session) new Session().withId(UUID.randomUUID().toString()).withTimeout(sessionTtl).withName(login).withPerson(person);
        Session existedSession = sessionProvider.getSessionIfExists(session);
        if (existedSession == null) {
            sessionProvider.addSession(session);
            response.addCookie(HttpUtils.createCookie(HttpUtils.SESSION_ID, session.getId(), authDomain, sessionTtl));
            return session;
        }
        else
            response.addCookie(HttpUtils.createCookie(HttpUtils.SESSION_ID, existedSession.getId(), authDomain, sessionTtl));
        return existedSession;
    }


    @Override
    protected Person getAdminPerson(String login, String password) {
System.out.println("DbAuthProvider.getAdminPerson() - login, password: " + login + ", " + password);
System.out.flush();

         final String secretKey = "al;jf;lda1_+_!!()!!!!";
         String decryptedAdminPassword = aes.decrypt(adminPassword, secretKey) ;

        if (!isEmpty(login) && !isEmpty(password) && login.equals(adminLogin) && password.equals(decryptedAdminPassword)){

System.out.println("DbAuthProvider.getAdminPerson() - admin validated successfully");
System.out.flush();


            return new Person().withLogin(adminLogin).withFirstName("admin");
        }
        throw new UnauthorizedException();
    }

    @Override
    protected Person findPersonByApiToken(String token) {
        if (!isEmpty(token) && token.equals(adminToken)){
            return new Person().withLogin(adminLogin).withFirstName("admin");
        }
        throw new UnauthorizedException();
    }

    @Override
    protected Person findPersonByLogin(String login) {
        Person person = convertUser(userService.findOne(null, new Filter().withField("login", login)));
        System.out.println("DbAuthProvider.findPersonByLogin - person: " + person);
        System.out.flush();
        //return convertUser(userService.findOne(null, new Filter().withField("login", login)));


        return person;
    }

    @Override
    public Set<String> suggestGroups(HttpServletRequest request, String literal) {
        return emptySet();
    }

    @Override
    public Set<String> getAllUsers(HttpServletRequest request) {
        /*return userService.findAll().stream().
                map(User::getLogin).
                collect(Collectors.toSet()); */
        Set<String> usersSet = userService.findAll().stream().
                map(User::getLogin).
                collect(Collectors.toSet());
        for (String user : usersSet) {
           System.out.println("UserResource.getAllUsers() - user: " + user);
           System.out.flush();
        }

        return usersSet;
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

        MongoDBInterface mongoDBInterface = new MongoDBInterface();
        String role = mongoDBInterface.getRole(user.getLogin());

        System.out.println("DBAuthProvider.convertUser - login, role: " + user.getLogin() + ", " + role);
        System.out.flush();

        return new Person().withFirstName(user.getFirstName()).
                withLastName(user.getLastName()).
                withLogin(user.getLogin()).
                withActive(true).
                withDefaultPassword(user.isPasswordChangeRequired()).
                withPassword(user.getPassword()).
                withRoles(user.getRole());
    }
}
