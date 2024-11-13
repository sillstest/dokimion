package com.testquack.api.utils;

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
        String username = "dokimionapplication@gmail.com";
        String password = "lloufleltofimtby";

        // Assuming you are sending email from through gmails smtp

        // Get system properties
        Properties properties = new Properties();

	// Setup mail server
        properties.put("mail.smtp.host", "smtp.gmail.com");
        properties.put("mail.smtp.starttls.enable", "true");
        properties.put("mail.smtp.port", "587"); 
	properties.put("mail.smtp.auth", "true");
	properties.put("mail.smtp.socketFactory.port", "true");
        properties.put("mail.smtp.socketFactory.class", "javax.net.ssl.SSLSocketFactory");

        Session session = Session.getInstance(properties,
                        new javax.mail.Authenticator() {
                           protected PasswordAuthentication getPasswordAuthentication() {
                              return new PasswordAuthentication(username, password);
                           }
                        });

	System.out.println("After session instantiation"); 

        // Used to debug SMTP issues
        //session.setDebug(true);

	System.out.println("After session setDebug");

        try {
            // Create a default MimeMessage object.
            MimeMessage message = new MimeMessage(session);

	    System.out.println("After MimeMessage constructor");

            // Set From: header field of the header.
            message.setFrom(new InternetAddress(username));

            // Set To: header field of the header.
            message.setRecipients(Message.RecipientType.TO, InternetAddress.parse(emailTo));

            // Set Subject: header field
            message.setSubject("Dokimion Forgot Password code");

            // Now set the actual message
            message.setText("Dokimion Forgot Password code: " + passwordCode);

            System.out.println("sending...");

            // Send message
            Transport.send(message);
            System.out.println("after Transport send");

        } catch (MessagingException mex) {
            mex.printStackTrace();
        } catch (Exception ex) {
            ex.printStackTrace();
	}

    }

}
