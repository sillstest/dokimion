package com.testquack.api.utils;

public class SendEmailThread implements Runnable {

  private final String email;
  private final String password;

  public SendEmailThread(String email, String password) {
    this.email = email;
    this.password = password;
  }

  @Override
  public void run() {
    // Your processing logic using the parameter
    System.out.println("Thread started with parameters: " + email + ", " + password);
    System.out.flush();

    SendEmail.send(this.email, this.password);

    System.out.println("Thread finished");
    System.out.flush();

  }

}

