package com.testquack.api.utils;

import com.testquack.dal.Logger;

import java.util.Properties;
import javax.mail.Message;
import javax.mail.MessagingException;
import javax.mail.PasswordAuthentication;
import javax.mail.Session;
import javax.mail.Transport;
import javax.mail.internet.InternetAddress;
import javax.mail.internet.MimeMessage;

public class SendEmail {

    public static void send(String emailTo, String passwordCode) {

        // Recipient's email ID needs to be mentioned.
        //String to = "fromaddress@gmail.com";
	String to = emailTo;

        // Sender's email ID needs to be mentioned
        String from = "siltester.bob@gmail.com";

        // Assuming you are sending email from through gmails smtp
        String host = "smtp.gmail.com";

        // Get system properties
        Properties properties = new Properties(System.getProperties());

        // Setup mail server
	properties.put("mail.transport.protocol", "smtp");
        properties.put("mail.smtp.host", host);
        properties.put("mail.smtp.port", "25"); 
        properties.put("mail.smtp.auth", "true");
        properties.put("mail.smtp.debug", "true");
        properties.put("mail.smtp.starttls.enable", "true");
        properties.put("mail.smtp.ssl.protocols", "TLSv1.2");

	Session session = Session.getInstance(properties, null);

	Logger.info("After session instantiation"); 

        // Used to debug SMTP issues
        session.setDebug(true);

	Logger.info("After session setDebug");

        try {
            // Create a default MimeMessage object.
            MimeMessage message = new MimeMessage(session);

	    Logger.info("After MimeMessage constructor");

            // Set From: header field of the header.
            message.setFrom(new InternetAddress(from));

            // Set To: header field of the header.
            message.addRecipient(Message.RecipientType.TO, new InternetAddress(to));

            // Set Subject: header field
            message.setSubject("Quack Forgot Password code");

            // Now set the actual message
            message.setText("Quack Forgot Password code: " + passwordCode);

            Logger.info("sending...");
            // Send message
            //Transport.send(message);
	    Transport tr = session.getTransport("smtp");
            Logger.info("after getTransport");

	    tr.connect(host, "siltester.bob@gmail.com", "tihkugzmcsohgxix");
            Logger.info("after transport connect");

	    tr.sendMessage(message, message.getAllRecipients());
            Logger.info("after transport sendMessage");

	    tr.close();
            Logger.info("after transport close");

        } catch (MessagingException mex) {
            mex.printStackTrace();
        } catch (Exception ex) {
            ex.printStackTrace();
	}

    }

}
