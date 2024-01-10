
import java.io.File;
import java.io.FileNotFoundException;
import java.io.UnsupportedEncodingException;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.Arrays;
import java.util.Base64;
import java.util.Scanner;

import javax.crypto.Cipher;
import javax.crypto.spec.SecretKeySpec;

public class AES {

  private static SecretKeySpec secretKey;
  private static byte[] key;

  public static void setKey(final String myKey) {
    MessageDigest sha = null;
    try {
      key = myKey.getBytes("UTF-8");
      sha = MessageDigest.getInstance("SHA-1");
      key = sha.digest(key);
      key = Arrays.copyOf(key, 16);
      secretKey = new SecretKeySpec(key, "AES");
    } catch (NoSuchAlgorithmException | UnsupportedEncodingException e) {
      e.printStackTrace();
    }
  }

  public static String encrypt(final String strToEncrypt, final String secret) {
    try {
      setKey(secret);
      Cipher cipher = Cipher.getInstance("AES/ECB/PKCS5Padding");
      cipher.init(Cipher.ENCRYPT_MODE, secretKey);
      return Base64.getEncoder()
        .encodeToString(cipher.doFinal(strToEncrypt.getBytes("UTF-8")));
    } catch (Exception e) {
      System.out.println("Error while encrypting: " + e.toString());
    }
    return null;
  }

  public static String decrypt(final String strToDecrypt, final String secret) {
    try {
      setKey(secret);
      Cipher cipher = Cipher.getInstance("AES/ECB/PKCS5PADDING");
      cipher.init(Cipher.DECRYPT_MODE, secretKey);
      return new String(cipher.doFinal(Base64.getDecoder()
        .decode(strToDecrypt.getBytes())));
    } catch (Exception e) {
      System.out.println("Error while decrypting: " + e.toString());
    }
    return null;
  }
  
  public static void main(final String[] args) {

    String propertiesFileName = "/etc/dokimion/quack.properties";
    String mongoAdminName = "auth.admin.login=";
    String mongoAdminPassword = "auth.admin.password=";
    String mongoUsername="", mongoPassword="";

    try {
       // read properties from file
       File myObj = new File(propertiesFileName);
       Scanner myReader = new Scanner(myObj);
       while (myReader.hasNextLine()) {
          String data = myReader.nextLine();
          if (data.startsWith(mongoAdminName)) {
             mongoUsername = data.substring(mongoAdminName.length());
          }
          if (data.startsWith(mongoAdminPassword)) {
             mongoPassword = data.substring(mongoAdminPassword.length());
          }
       }
       myReader.close();
    } catch (FileNotFoundException e) {
      System.out.println("File Not Found exception");
    }

    final String secretKey = "al;jf;lda1_+_!!()!!!!";
    String decryptedString = AES.decrypt(mongoPassword, secretKey) ;
    System.out.println("/usr/bin/mongosh -u admin -p " + decryptedString + " < /home/bob/dokimion/config/common/mongodb_RoleCapability_init.js");

    System.out.flush();

  }

}
