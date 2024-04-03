import java.lang.ProcessBuilder.Redirect;
import java.lang.Process;
import java.lang.ProcessBuilder;
import java.lang.ProcessBuilder.*;
import java.util.*;
import java.io.*;

public class DefaultProjectAttributes {

  public static void main(final String[] args) {

    String adminPassword = AdminPassword.getDecryptedString();

    try {
       //ProcessBuilder pb = new ProcessBuilder("/usr/bin/mongosh")
       ProcessBuilder pb = new ProcessBuilder("/usr/bin/mongosh", "-u", "admin", "-p", adminPassword)
		  .redirectInput(new File("./mongodb_DefaultProjectAttributes_init.js"))
                  .redirectOutput(Redirect.INHERIT)
		  .redirectError(Redirect.INHERIT);
       Process p = pb.start();
       int rc = p.waitFor();
   } catch (Exception e) {
      e.printStackTrace();
   }

  }

}





