import java.lang.ProcessBuilder.Redirect;
import java.lang.Process;
import java.lang.ProcessBuilder;
import java.lang.ProcessBuilder.*;
import java.util.*;
import java.io.*;

public class RoleCapability {

  public static void main(final String[] args) {

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
    String decryptedString = aes.decrypt(mongoPassword, secretKey) ;

    try {
       ProcessBuilder pb = new ProcessBuilder("/usr/bin/mongosh", "-u", "admin", "-p", decryptedString)
		  .redirectInput(new File("./mongodb_RoleCapability_init.js"))
                  .redirectOutput(Redirect.INHERIT)
		  .redirectError(Redirect.INHERIT);
       Process p = pb.start();
       int rc = p.waitFor();
   } catch (Exception e) {
      e.printStackTrace();
   }

  }

}



