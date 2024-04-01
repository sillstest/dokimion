package com.testquack.services;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import com.testquack.beans.Filter;
import com.testquack.dal.OrganizationRepository;
import com.testquack.services.errors.EntityAccessDeniedException;
import com.testquack.services.errors.EntityValidationException;
import com.testquack.services.errors.EntityNotFoundException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import com.testquack.beans.User;
import com.testquack.dal.CommonRepository;
import com.testquack.dal.UserRepository;
import ru.greatbit.utils.string.StringUtils;
import ru.greatbit.whoru.auth.Session;

import java.security.NoSuchAlgorithmException;
import java.util.Collection;
import java.util.List;
import java.util.stream.Collectors;
import java.util.stream.StreamSupport;

import static java.lang.String.format;
import static org.apache.commons.lang3.StringUtils.isEmpty;

@Service
public class UserService extends BaseService<User> {

    @Autowired
    private UserRepository repository;

    @Autowired
    private OrganizationRepository organizationRepository;

    @Override
    protected CommonRepository<User> getRepository() {
        return repository;
    }

    @Override
    protected boolean userCanRead(Session session, String projectId, User entity) {
        return true;
    }

    @Override
    protected boolean userCanSave(Session session, String projectId, User entity) {
        return userCanSave(session, entity.getId());
    }

    protected boolean userCanSave(Session session, String login) {

System.out.println("UserService::userCanSave - session: " + session);
System.out.println("UserService::userCanSave - login: " + login);
System.out.flush();

        return isAdmin(session) || login.equals(session.getPerson().getLogin());
    }

    @Override
    protected boolean userCanSave(Session session, String projectId, Collection<User> entities) {
        return isAdmin(session);
    }

    @Override
    protected boolean userCanDelete(Session session, String projectId, String id) {
	User user = findOne(session, projectId, id);
System.out.println("UserService::userCanDelete - user: " + user);
System.out.flush();
	if (user.isLocked()) {
	   return false;
	}
	return userCanSave(session, id);
    }

    @Override
    protected boolean userCanCreate(Session session, String projectId, User entity) {

        return isAdmin(session);
    }

    @Override
    protected boolean userCanUpdate(Session session, String projectId, User entity) {
        return userCanSave(session, entity.getId());
    }


    @Override
    public User findOne(Session session, String projectId, String id) {

System.out.println("UserService.findOne - projectId, id: " + projectId + "," + id);
System.out.println("UserService.findOne - session: " + session);
System.out.flush();

        //return cleanUserSesitiveData(super.findOne(session, projectId, id));
        User user = cleanUserSensitiveData(super.findOne(session, projectId, id));

System.out.println("UserService.findOne - user: " + user);
System.out.flush();

        return user;
    }

    @Override
    protected void beforeCreate(Session session, String projectId, User user) {
        super.beforeCreate(session, projectId, user);
        if(exists(session, projectId, user.getLogin())){
            throw new RuntimeException(format("User with login %s already exists", user.getLogin()));
        }
        user.setLogin(user.getLogin().trim());
        user.setId(user.getLogin());
        user.setPassword(encryptPassword(user.getPassword(), user.getLogin()));
        user.setPasswordChangeRequired(true);
    }

    @Override
    protected boolean validateEntity(User ent) {
        return !isEmpty(ent.getLogin());
    }

    public static String encryptPassword(String password, String salt) {
        try {
            return StringUtils.getMd5String(password + salt);
        } catch (NoSuchAlgorithmException e) {
            throw new RuntimeException(e);
        }
    }

    public void changePassword(Session session, String login, String oldPassword, String newPassword) {
        if (userCanSave(session, login)){
            User user = findOne(getCurrOrganizationId(session), new Filter().withField("login", login));
	    StringBuilder exceptionMessage = new StringBuilder("");
	    if (PasswordValidation.validatePassword(newPassword, exceptionMessage)) {
               user.setPassword(encryptPassword(newPassword, user.getLogin()));
               user.setPasswordChangeRequired(false);
               save(session, null, user);
            } else {
               throw new EntityValidationException(format("User %s password %s validation error - %s", login, newPassword, exceptionMessage.toString()));
	    }
        } else {
            throw new EntityAccessDeniedException(format("User %s doesn't have permissions to modify %s account", session.getPerson().getLogin(), login));
        }
    }

    public Session changeOrganization(Session session, String organizationId){
        if (!isUserInOrganization(session, organizationId)){
            throw new EntityNotFoundException("Organization " + organizationId + " not found");
        }
        session.getMetainfo().put(CURRENT_ORGANIZATION_KEY, organizationId);
        return session;
    }

    /////// Non-authenticable for internal usage

    public User findOne(String organizationId, Filter filter) {
        return repository.find(organizationId,null, filter).stream().findFirst().orElseThrow(EntityNotFoundException::new);
    }

    public List<User> findAll() {
System.out.println("UserService::findAll");
System.out.flush();

        List<User> usersList = StreamSupport.stream(repository.findAll().spliterator(), false).collect(Collectors.toList());
        for (User user : usersList) {
           System.out.println("UserService.findAll() - user: " + user);
           System.out.flush();
        }
        return usersList;
        //return StreamSupport.stream(repository.findAll().spliterator(), false).collect(Collectors.toList());
    }

    public List<User> suggestUsers(String organizationId, String literal) {
        return repository.suggestUsers(organizationId, literal);
    }


    private User cleanUserSensitiveData(User user){
        return user.withPassword(null).withToken(null);
    }

    public boolean setLocked(Session session, boolean lockedValue) {

       String userLogin = session.getPerson().getLogin();
       String userPassword = session.getPerson().getPassword();

 System.out.println("setLocked - userLogin: " + userLogin);
 System.out.println("setLocked - userPassword: " + userPassword);

       if (!session.isIsAdmin() && UserSecurity.isAdmin(userRepository, roleCapRepository, userLogin) == false) {

          User user = findOne(session, null, userLogin);
          user.setLocked(lockedValue);
          user.setLogin(userLogin);
	  if (!userPassword.equals("")) 
             user.setPassword(userPassword);

          User updatedUser = save(session, null, user);
System.out.println("setLocked - updatedUser: " + updatedUser);
System.out.flush();
          if (updatedUser == null) {
             System.out.println("UserService::setLocked - updatedUser = null");
             System.out.flush();
             return false;
          }
 System.out.println("setLocked - set lock = " + lockedValue);
 System.out.flush();
          return true;

       }

       return false;
    }

}


