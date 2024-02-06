import java.util.*;
import java.io.*;

public class AdminPassword {

  public static String getDecryptedString() {

    String propertiesFileName = "/etc/dokimion/quack.properties";
    String mongoAdminPassword = "auth.admin.password=";
    String mongoPassword="";

    try {
       // read properties from file
       File myObj = new File(propertiesFileName);
       Scanner myReader = new Scanner(myObj);
       while (myReader.hasNextLine()) {
          String data = myReader.nextLine();
          if (data.startsWith(mongoAdminPassword)) {
             mongoPassword = data.substring(mongoAdminPassword.length());
          }
       }
       myReader.close();
    } catch (FileNotFoundException e) {
      System.out.println("File Not Found exception");
    }

    final String secretKey = "al;jf;lda1_+_!!()!!!!";
    String decryptedPassword = aes.decrypt(mongoPassword, secretKey) ;

    return decryptedPassword;

  }

}



