package com.testquack.services;

import org.passay.CharacterCharacteristicsRule;
import org.passay.CharacterRule;
import org.passay.EnglishCharacterData;
import org.passay.EnglishSequenceData;
import org.passay.LengthRule;
import org.passay.PasswordData;
import org.passay.PasswordValidator;
import org.passay.Rule;
import org.passay.RuleResult;
import org.passay.WhitespaceRule;
import org.passay.IllegalCharacterRule;
import org.passay.IllegalSequenceRule;
import org.passay.RepeatCharacterRegexRule;
import org.passay.UsernameRule;

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
import java.util.ArrayList;
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
        return session.isIsAdmin() || login.equals(session.getPerson().getLogin());
    }

    @Override
    protected boolean userCanSave(Session session, String projectId, Collection<User> entities) {
        return session.isIsAdmin();
    }

    @Override
    protected boolean userCanDelete(Session session, String projectId, String id) {
        return userCanSave(session, id);
    }

    @Override
    protected boolean userCanCreate(Session session, String projectId, User entity) {
        return session.isIsAdmin();
    }

    @Override
    protected boolean userCanUpdate(Session session, String projectId, User entity) {
        return userCanSave(session, entity.getId());
    }


    @Override
    public User findOne(Session session, String projectId, String id) {
        return cleanUserSesitiveData(super.findOne(session, projectId, id));
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

    public boolean validatePassword(String passwordStr) {

      List<Rule> rules = new ArrayList<>();

      //Rule 1: Password length should be in between 
      //8 and 16 characters
      rules.add(new LengthRule(8, 16));

      //Rule 2: No whitespace allowed
      rules.add(new WhitespaceRule());

      //Rule 3.a: One Upper-case character
      rules.add(new CharacterRule(EnglishCharacterData.UpperCase, 1));        
      //Rule 3.b: One Lower-case character
      rules.add(new CharacterRule(EnglishCharacterData.LowerCase, 1));        
      //Rule 3.c: One digit
      rules.add(new CharacterRule(EnglishCharacterData.Digit, 1));        
      //Rule 3.d: One special character
      rules.add(new CharacterRule(EnglishCharacterData.Special, 1));

      rules.add(new IllegalCharacterRule(new char[] {'&', '<', '>'}));
      rules.add(new IllegalSequenceRule(EnglishSequenceData.USQwerty));
      rules.add(new IllegalSequenceRule(EnglishSequenceData.Alphabetical));
      rules.add(new IllegalSequenceRule(EnglishSequenceData.Numerical));
      rules.add(new RepeatCharacterRegexRule());
      rules.add(new UsernameRule(true, true));

      PasswordValidator validator = new PasswordValidator(rules);
      PasswordData password = new PasswordData(passwordStr);
      RuleResult result = validator.validate(password);

      if (result.isValid() == false) {
	 List<String> messages = validator.getMessages(result);
	 String newMessage = "";
	 for (String message : messages) {
	   newMessage = newMessage + message;
	 }
													       System.out.flush();
         return false;
      }
      return true;
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
	    if (validatePassword(user.getPassword())) {
               user.setPassword(encryptPassword(user.getPassword(), user.getLogin()));
               user.setPasswordChangeRequired(true);
               save(session, null, user);
            } else {
               throw new EntityValidationException(format("User %s password validation error", session.getPerson().getLogin()));
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
        return StreamSupport.stream(repository.findAll().spliterator(), false).collect(Collectors.toList());
    }

    public List<User> suggestUsers(String organizationId, String literal) {
        return repository.suggestUsers(organizationId, literal);
    }


    private User cleanUserSesitiveData(User user){
        return user.withPassword(null).withToken(null);
    }


}
