
package com.testquack.dal;


public class DokimionLogger {

   enum logStateEnum {OFF, ON};
   private static logStateEnum logState = logStateEnum.OFF;

   public static void info(String msg) {

      if (logState == logStateEnum.ON) {
         System.out.println(msg);
	 System.out.flush();
      }
   }



};
