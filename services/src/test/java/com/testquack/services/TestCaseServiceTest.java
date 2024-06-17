package com.testquack.services;

import com.testquack.dal.Logger;
import java.io.FileInputStream;
import java.io.InputStream;
import java.io.IOException;
import java.io.FileNotFoundException;
import com.testquack.beans.Filter;
import com.testquack.beans.Attachment;
import com.testquack.services.errors.EntityAccessDeniedException;
import com.testquack.services.errors.EntityNotFoundException;

import ru.greatbit.whoru.auth.Person;

import junit.framework.TestCase;
import org.junit.Test;
import java.util.List;
import java.util.ArrayList;

import static junit.framework.TestCase.assertNull;
import static org.hamcrest.Matchers.is;
import static org.junit.Assert.assertNotNull;
import static org.junit.Assert.assertThat;


public class TestCaseServiceTest extends BaseTest{

    String c_attachmentId;

    @Test
    public void adminCanSeeAllTestCasesTest(){
        assertThat(testCaseService.findFiltered(adminSession, project1.getId(), new Filter()).size(), is(7));
        assertThat(testCaseService.findFiltered(adminSession, project2.getId(), new Filter()).size(), is(3));
        assertThat(testCaseService.findFiltered(adminSession, project3.getId(), new Filter()).size(), is(3));
    }

    @Test
    public void adminCanAccessAllTestCasesTest(){
        assertNotNull(testCaseService.findOne(adminSession, project1.getId(), testCasesProject1.get(0).getId()));
        assertNotNull(testCaseService.findOne(adminSession, project2.getId(), testCasesProject2.get(0).getId()));
        assertNotNull(testCaseService.findOne(adminSession, project3.getId(), testCasesProject3.get(0).getId()));
    }

    @Test
    public void userCanSeeOnlyHisProjectsTestCasesTest(){
        assertThat(testCaseService.findFiltered(userSession, project1.getId(), new Filter()).size(), is(7));
        assertThat(testCaseService.findFiltered(userSession, project2.getId(), new Filter()).size(), is(3));
        assertThat(testCaseService.findFiltered(userSession, project3.getId(), new Filter()).size(), is(3));
    }

    @Test(expected = NullPointerException.class)
    public void userCanAccessHisProjectsTestCasesTest(){
        assertNotNull(testCaseService.findOne(userSession, project1.getId(), testCasesProject1.get(0).getId()));
        assertNotNull(testCaseService.findOne(userSession, project2.getId(), testCasesProject2.get(0).getId()));
    }

    @Test(expected = NullPointerException.class)
    public void userCanNotAccessRestrictedProjectsTestCasesTest(){
        TestCase.assertNull(testCaseService.findOne(userSession, project3.getId(), testCasesProject3.get(0).getId()));
    }

   @Test
   public void userCanUploadAttachment() {

      String attachmentFileName = "/home/bob/dokimion/README.md";
      try {
         InputStream attachmentInputStream = new FileInputStream(attachmentFileName);
         assertNotNull(attachmentInputStream);
         assertNotNull(attachmentInputStream.available());
         assertNotNull(project3.getId());
         assertNotNull(testCasesProject3.get(0).getId());

         com.testquack.beans.TestCase tc = testCaseService.uploadAttachment(adminSession, project3.getId(), testCasesProject3.get(0).getId(), attachmentInputStream, attachmentFileName, attachmentInputStream.available());

         assertNotNull(tc);

         List<Attachment> attachmentsList = tc.getAttachments();
         c_attachmentId = attachmentsList.get(0).getId();


      } catch (FileNotFoundException exc) {
         Logger.info("userCanUploadAttachment - Filename: " + attachmentFileName + " not found");
      } catch (IOException exc) {
         Logger.info("userCanUploadAttachment - Filename: " + attachmentFileName + " not found");
      }

   }

   @Test
   public void userCanNOTUploadAttachment() {

      String attachmentFileName = "/home/bob/dokimion/UNKNOWN.md";
      try {

         InputStream attachmentInputStream = new FileInputStream(attachmentFileName);
         assertNotNull(attachmentInputStream);
         assertNotNull(attachmentInputStream.available());
         assertNotNull(project3.getId());
         assertNotNull(testCasesProject3.get(0).getId());

         assertNotNull(testCaseService.uploadAttachment(adminSession, project3.getId(), testCasesProject3.get(0).getId(), attachmentInputStream, attachmentFileName, attachmentInputStream.available()));

      } catch (FileNotFoundException exc) {
         Logger.info("userCanNOTUploadAttachment - Filename: " + attachmentFileName + " not found");
      } catch (IOException exc) {
         Logger.info("userCanNOTUploadAttachment - Filename: " + attachmentFileName + " not found");
      }

   }

   @Test
   public void userCanGetAttachment() {

      userCanUploadAttachment();

      String attachmentId = "0";
      assertNotNull(project3.getId());
      assertNotNull(testCasesProject3.get(0).getId());

      Logger.info("userSession: " + userSession);

      com.testquack.beans.TestCase testCase = testCaseService.findOne(adminSession, project3.getId(), testCasesProject3.get(0).getId());

      Logger.info("tc: " + testCase);
      assertNotNull(testCase);

      Attachment attach = testCaseService.getAttachment(adminSession, project3.getId(), testCase.getId(), c_attachmentId);
      assertNotNull(attach);

   }

   @Test(expected = EntityNotFoundException.class)
   public void userCanNOTGetAttachment() {

      String attachmentId = "x";
      assertNotNull(project3.getId());
      assertNotNull(testCasesProject3.get(0).getId());

      com.testquack.beans.TestCase testCase = testCaseService.findOne(adminSession, project3.getId(), testCasesProject3.get(0).getId());

      Logger.info("tc: " + testCase);
      assertNotNull(testCase);

      assertNull(testCaseService.getAttachment(adminSession, project3.getId(), testCase.getId(), attachmentId));

   }
   @Test
   public void userCanDeleteAttachment() {

      userCanUploadAttachment();

      assertNotNull(project3.getId());
      assertNotNull(testCasesProject3.get(0).getId());

      com.testquack.beans.TestCase testCase = testCaseService.findOne(adminSession, project3.getId(), testCasesProject3.get(0).getId());

      Logger.info("tc: " + testCase);
      assertNotNull(testCase);

      try {
         assertNotNull(testCaseService.deleteAttachment(adminSession, project3.getId(), testCase.getId(), c_attachmentId));
      } catch (IOException exc) {
         Logger.info("userCanDeleteAttachment - attachmentId: " + c_attachmentId);
      }

   }

   @Test(expected = EntityNotFoundException.class)
   public void userCanNOTDeleteAttachment() {

      String attachmentId = "0";
      assertNotNull(project3.getId());
      assertNotNull(testCasesProject3.get(0).getId());

      com.testquack.beans.TestCase testCase = testCaseService.findOne(adminSession, project3.getId(), testCasesProject3.get(0).getId());

      Logger.info("tc: " + testCase);
      assertNotNull(testCase);

      try {
         assertNotNull(testCaseService.deleteAttachment(adminSession, project3.getId(), testCase.getId(), attachmentId));
      } catch (IOException exc) {
         Logger.info("userCanNOTDeleteAttachment - attachmentId: " + attachmentId);
      }

   }


}
