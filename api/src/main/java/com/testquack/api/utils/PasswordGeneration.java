package com.testquack.api.utils;

import org.passay.CharacterCharacteristicsRule;
import org.passay.CharacterRule;
import org.passay.EnglishCharacterData;
import org.passay.EnglishSequenceData;
import org.passay.LengthRule;
import org.passay.PasswordData;
import org.passay.PasswordGenerator;
import org.passay.Rule;
import org.passay.RuleResult;
import org.passay.WhitespaceRule;
import org.passay.IllegalCharacterRule;
import org.passay.IllegalSequenceRule;
import org.passay.RepeatCharacterRegexRule;
import org.passay.UsernameRule;

import java.util.List;
import java.util.ArrayList;

public class PasswordGeneration {

   public static String generatePassword() {

      List<CharacterRule> rules = new ArrayList();
      //Rule 2: At least one Upper-case character
      rules.add(new CharacterRule(EnglishCharacterData.UpperCase, 1));
      //Rule 3: At least one Lower-case character
      rules.add(new CharacterRule(EnglishCharacterData.LowerCase, 1));
      //Rule 4: At least one digit
      rules.add(new CharacterRule(EnglishCharacterData.Digit, 1));
      //Rule 5: At least one special character
      rules.add(new CharacterRule(EnglishCharacterData.Special, 1));

      PasswordGenerator passwordGenerator = new PasswordGenerator();        
      String password = passwordGenerator.generatePassword(16, rules);

      System.out.println("Password generated: " + password);

      return password;
   }


}

