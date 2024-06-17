package com.testquack.services;

import com.testquack.beans.Filter;
import com.testquack.dal.OrganizationRepository;
import com.testquack.services.errors.EntityAccessDeniedException;
import com.testquack.services.errors.EntityValidationException;
import com.testquack.services.errors.EntityNotFoundException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import com.testquack.beans.User;
import com.testquack.dal.Logger;
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
Logger.info("UserService::userCanSave - login: " + login);
Logger.info("UserService::userCanSave - session: " + session);

        return isAdmin(session) || login.equals(session.getPerson().getLogin());
    }

    @Override
    protected boolean userCanSave(Session session, String projectId, Collection<User> entities) {
        return isAdmin(session);
    }

    @Override
    protected boolean userCanDelete(Session session, String projectId, String id) {
	User user = findOne(session, projectId, id);
Logger.info("UserService::userCanDelete - user: " + user);
Logger.info("UserService::userCanDelete - projectId: " + projectId);
Logger.info("UserService::userCanDelete - session: " + session);

        if (user.isLocked()) {
Logger.info("UserService::userCanDelete - user locked = true");
           return false;
        }
Logger.info("UserService::userCanDelete - user locked = false");
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

Logger.info("UserService.findOne - projectId, id: " + projectId + "," + id);
Logger.info("UserService.findOne - session: " + session);

        //return cleanUserSesitiveData(super.findOne(session, projectId, id));
        User user = cleanUserSensitiveData(super.findOne(session, projectId, id));
        return cleanUserSensitiveData(super.findOne(session, projectId, id));
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
Logger.info("changePassword - session: " + session);
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
Logger.info("UserService::findAll");

        List<User> usersList = StreamSupport.stream(repository.findAll().spliterator(), false).collect(Collectors.toList());
        for (User user : usersList) {
           Logger.info("UserService.findAll() - user: " + user);
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

Logger.info("UserService::setLocked - session: " + session);
Logger.info("UserService::setLocked - lockedValue: " + lockedValue);
       String userLogin = session.getPerson().getLogin();
       String userPassword = session.getPerson().getPassword();
Logger.info("UserService::setLocked - userLogin: " + userLogin);
Logger.info("UserService::setLocked - userPassword: " + userPassword);

       if (!session.isIsAdmin() && UserSecurity.isAdmin(userRepository, roleCapRepository, userLogin) == false) {

Logger.info("UserService::setLocked - NOT an admin");
          User user = findOne(session, null, userLogin);
          user.setLocked(lockedValue);
          user.setLogin(userLogin);
	  if (!userPassword.equals("")) 
             user.setPassword(userPassword);

          User updatedUser = save(session, null, user);
Logger.info("setLocked - updatedUser: " + updatedUser);
          if (updatedUser == null) {
             Logger.info("UserService::setLocked - updatedUser = null");
             return false;
          }
 Logger.info("setLocked - set lock end");
          return true;

       }

       return false;
    }

}


