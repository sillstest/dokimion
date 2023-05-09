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

import java.util.List;

public class PasswordValidation {

    public static boolean validatePassword(String passwordStr, StringBuilder exceptionMessage) {

      //Rule 1: Password length should be in between 
      //8 and 16 characters
      Rule rule1 = new LengthRule(8, 16);

      //Rule 2: No whitespace allowed
      Rule rule2 = new WhitespaceRule();

      //Rule 3.a: One Upper-case character
      CharacterCharacteristicsRule rule3 = new CharacterCharacteristicsRule();
      rule3.setNumberOfCharacteristics(4);
	      
      rule3.getRules().add(new CharacterRule(EnglishCharacterData.UpperCase, 1));
      //Rule 3.b: One Lower-case character
      rule3.getRules().add(new CharacterRule(EnglishCharacterData.LowerCase, 1));        
      //Rule 3.c: One digit
      rule3.getRules().add(new CharacterRule(EnglishCharacterData.Digit, 1));        
      //Rule 3.d: One special character
      rule3.getRules().add(new CharacterRule(EnglishCharacterData.Special, 1));

      IllegalCharacterRule rule4 = new IllegalCharacterRule(new char[] {'&', '<', '>'});
      IllegalSequenceRule rule5 = new IllegalSequenceRule(EnglishSequenceData.USQwerty);
      IllegalSequenceRule rule6 = new IllegalSequenceRule(EnglishSequenceData.Alphabetical);
      IllegalSequenceRule rule7 = new IllegalSequenceRule(EnglishSequenceData.Numerical);
      RepeatCharacterRegexRule rule8 = new RepeatCharacterRegexRule();
      UsernameRule rule9 = new UsernameRule(true, true);

      PasswordValidator validator = new PasswordValidator(rule1, rule2, rule3, rule4, rule5,
		      rule6, rule7, rule8, rule9);
      PasswordData password = new PasswordData(passwordStr);
      RuleResult result = validator.validate(password);

      if (result.isValid() == false) {
	 List<String> messages = validator.getMessages(result);
	 for (String message : messages) {
	   exceptionMessage.append(message + "; ");
	 }
         return false;
      }
      return true;
   }

}

