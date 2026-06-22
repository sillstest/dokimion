using Boa.Constrictor.Screenplay;
using Boa.Constrictor.Selenium;
using Dokimion.Interactions;
using Dokimion.Pages;
using OpenQA.Selenium;
using OpenQA.Selenium.Chrome;
using OpenQA.Selenium.Interactions;
using System;
using System.Collections.ObjectModel;
using WebDriverManager;
using WebDriverManager.DriverConfigs.Impl;
using WebDriverManager.Helpers;

namespace Dokimion.Tests
{
    internal class TestCaseTests
    {
        private IActor Actor;
        UserActions userActions;
        ChromeDriver driver;

        [OneTimeSetUp]
        public void Setup()
        {

            userActions = new UserActions();
            userActions.LogConsoleMessage("In one time Set up :" + TestContext.CurrentContext.Test.ClassName);
            userActions.LogConsoleMessage("Register Driver & Open the Dokimion website");

            Actor = new Actor(name: userActions.ActorName, logger: new NoOpLogger());
            //This will match ChromeDriver and web browser versions
            new DriverManager().SetUpDriver(new ChromeConfig(), VersionResolveStrategy.MatchingBrowser);


            driver = new ChromeDriver(userActions.GetChromeOptions());
            driver.Manage().Window.Maximize();
            driver.Manage().Timeouts().PageLoad = TimeSpan.FromSeconds(300);

            ICapabilities capabilities = driver.Capabilities;
            var browserName = capabilities.GetCapability("browserName");
            var browserVersion = capabilities.GetCapability("browserVersion");
            var SeleniumWebDriverVersion = (capabilities.GetCapability("chrome") as Dictionary<string, object>)!["chromedriverVersion"];

            userActions.LogConsoleMessage("BrowserName : " + browserName);
            userActions.LogConsoleMessage("browserVersion : " + browserVersion);
            userActions.LogConsoleMessage("ChromeDriver : " + driver.GetType().ToString());
            userActions.LogConsoleMessage("SeleniumWebDriverVersion " + SeleniumWebDriverVersion);

            var count = 1;

            try
            {
                Actor.Can(BrowseTheWeb.With(driver));
                Actor.AttemptsTo(Navigate.ToUrl(userActions.DokimionUrl));
                //Actor.AttemptsTo(Navigate.ToUrl("http://192.168.56.103"));

                //Page is redirected after initial URL
                Actor.AttemptsTo(Wait.Until(Appearance.Of(LoginPage.NameInput), IsEqualTo.True()));
            }
            catch (Exception ex)
            {
                Actor.AttemptsTo(Wait.Until(Appearance.Of(LoginPage.NameInput), IsEqualTo.True()).ForAnAdditional(3));
                userActions.LogConsoleMessage("Unable to load page : retried with addtionatime on " + count + " " + ex.ToString());

            }

            Actor.WaitsUntil(Appearance.Of(LoginPage.LoginPageWelcomeMsg), IsEqualTo.True());
            var welcomeMessage = Actor.AskingFor(Text.Of(LoginPage.LoginPageWelcomeMsg));
            userActions.LogConsoleMessage("Login Page is loaded successfully on count " + count + " " + welcomeMessage);

            userActions.LogConsoleMessage("Set Up : ");
            userActions.LogConsoleMessage("Login as Admin");
            //Actor.AttemptsTo(LoginUser.For(userActions.Username!, userActions.Password!));
            Actor.AttemptsTo(LoginUser.For(userActions.AdminUser!, userActions.AdminPass!));
            Actor.WaitsUntil(Appearance.Of(Header.DokimionProject), IsEqualTo.True(), timeout: 15);
            Actor.AttemptsTo(Click.On(Header.DokimionProject));
        }


        [OneTimeTearDown]
        public void QuitBrowser()
        {
            Actor.AttemptsTo(Logout.For());
            Actor.AttemptsTo(QuitWebDriver.ForBrowser());
        }

        [TearDown]
        public void TearDownAfterTestCase()
        {
            userActions.TearDownAfterTestcase();
        }

        [Test]

        public void TC07CreateTestCase()
        {
            userActions.LogConsoleMessage(TestContext.CurrentContext.Test.MethodName!);
            userActions.LogConsoleMessage("Set Up : ");
            userActions.LogConsoleMessage("Action steps : ");

            userActions.LogConsoleMessage("Click on the Testcases on header");
            Actor.AttemptsTo(Click.On(Header.TestCases));

            // Confirm we actually landed on the TestCases page before reaching for the Add button.
            // FilterLocator (the funnel icon) is always present once the filter panel renders, so it's
            // a reliable "page loaded" signal; if it times out, the nav didn't reach the testcases page.
            userActions.LogConsoleMessage("URL after TestCases nav: " + driver.Url);
            Actor.WaitsUntil(Appearance.Of(TestCases.FilterLocator), IsEqualTo.True(), timeout: 60);

            userActions.LogConsoleMessage("Click on the '+' to Add Test cases");
            Actor.AttemptsTo(Click.On(TestCases.AddTestCase));

            userActions.LogConsoleMessage("Enter the Test Case TCNames");
            Actor.WaitsUntil(Appearance.Of(TestCases.TestCaseName), IsEqualTo.True());
            Actor.AttemptsTo(Clear.On(TestCases.TestCaseName));
            Actor.AttemptsTo(SendKeys.To(TestCases.TestCaseName, "Validate login"));

            userActions.LogConsoleMessage("Enter the Test Case Description");
            Actor.AttemptsTo(SendKeys.To(TestCases.TestCaseDescription, "Test that validates login"));

            userActions.LogConsoleMessage("Submit the Save Changes button");
            Actor.AttemptsTo(Click.On(TestCases.SaveTestCaseButton));
            try
            {
                string tcName = SelectTestCase("Validate login");

                userActions.LogConsoleMessage("Verify : Testcase is created");
                StringAssert.Contains("Validate login", tcName);
            }
            finally { 
            userActions.LogConsoleMessage("Clean up:");
            userActions.LogConsoleMessage("Click on the Remove Testcase button");
            Actor.AttemptsTo(DeleteTestCase.For(driver));
            }
        }

        [Test]
        public void TC08Add2StepsToTestCase()
        {
            userActions.LogConsoleMessage(TestContext.CurrentContext.Test.MethodName!);
            userActions.LogConsoleMessage("Set Up : ");
            userActions.LogConsoleMessage("Remove any leftover 'Add2StepsToTestCase' from a prior run (idempotent start)");
            PurgeTestCasesByName("Add2StepsToTestCase");
            Actor.AttemptsTo(CreatTestCase.For("Add2StepsToTestCase", "Testcase for adding 2 Steps"));

            
            userActions.LogConsoleMessage("Action steps : ");
            userActions.LogConsoleMessage("Click on the Add2StepsToTestCase TestcaseName");
           
            try
            {
                Actions actions = new Actions(driver);
                SelectTestCase("Add2StepsToTestCase");

                userActions.LogConsoleMessage("Click on the Add Steps Button to input step 1");
                Actor.WaitsUntil(Appearance.Of(TestCases.AddStepButton), IsEqualTo.True());
                Actor.AttemptsTo(Hover.Over(TestCases.AddStepButton));
                Actor.AttemptsTo(Click.On(TestCases.AddStepButton));

                actions.SendKeys(Keys.PageDown).Pause(TimeSpan.FromSeconds(1)).Build().Perform();
                //Steps
                Actor.AttemptsTo(WriteToIframe.For(driver, 2, "Go to Quack home page"));
                //Expectations
                Actor.AttemptsTo(WriteToIframe.For(driver, 3, "Quack login page opens"));
                //dynamic element need to wait

                userActions.LogConsoleMessage("Click on the Save Button to input step 1");
                Actor.WaitsUntil(Appearance.Of(TestCases.SaveStep1), IsEqualTo.True(), timeout:45);
                Actor.AttemptsTo(Hover.Over(TestCases.SaveStep1));
                Actor.AttemptsTo(Click.On(TestCases.SaveStep1));

                // Wait for step 1 to finish saving (its text renders in display mode) before
                // adding step 2. The save is async and replaces the whole steps array with the
                // server response; if we append step 2 before it resolves, the response
                // overwrites it and the steps-1-form never renders.
                Actor.WaitsUntil(Appearance.Of(TestCases.Step1Text), IsEqualTo.True(), timeout: 45);

                //Add 2nd step
                userActions.LogConsoleMessage("Click on the Add Steps Button to input step 2");
                Actor.WaitsUntil(Appearance.Of(TestCases.AddStepButton), IsEqualTo.True());

                Actor.AttemptsTo(Hover.Over(TestCases.AddStepButton));
                Actor.AttemptsTo(Click.On(TestCases.AddStepButton));

                //Step 2
                Actor.AttemptsTo(WriteToIframe.For(driver, 4, "Login as admin"));
                //Expectations 2
                Actor.AttemptsTo(WriteToIframe.For(driver, 5, "List of projects opens"));

                //Scroll down page
               // Actions actions = new Actions(driver);
                actions.SendKeys(Keys.PageDown).Pause(TimeSpan.FromSeconds(1)).Build().Perform();

                userActions.LogConsoleMessage("Click on the Save Button to input step 1");
                Actor.WaitsUntil(Appearance.Of(TestCases.SaveStep2), IsEqualTo.True(), timeout: 45);
                Actor.AttemptsTo(Click.On(TestCases.SaveStep2));
                // Verify
                userActions.LogConsoleMessage("Verify : Step 1 conatins Go to Quack home page");
                string step1Text = Actor.AskingFor(Text.Of(TestCases.Step1Text));
                Assert.That(step1Text, Is.EqualTo("Go to Quack home page"));

                userActions.LogConsoleMessage("Step 2 conatins Login as admin");
                string step2Text = Actor.AskingFor(Text.Of(TestCases.Step2Text));
                Assert.That(step2Text, Is.EqualTo("Login as admin"));
            }
            finally {
            userActions.LogConsoleMessage("Clean up :");
            userActions.LogConsoleMessage("Removed 2nd step");
            // RemoveStep() must not block deletion: if it throws, DeleteTestCase is skipped and
            // the "Add2StepsToTestCase" test case leaks. Leaked test cases make SelectTestCase
            // (LastOrDefault) pick a non-fresh case that already has a step at index 0, which
            // shifts every WriteToIframe index and makes SaveStep1 resolve to the hidden
            // saved-step edit form -> 45s timeout. Always run DeleteTestCase.
            try { RemoveStep(); }
            catch (Exception ex) { userActions.LogConsoleMessage("RemoveStep cleanup failed (ignored): " + ex); }

            Actor.AttemptsTo(DeleteTestCase.For(driver));
            }
        }

        [Test]
        public void TC09UpdateExpectation2()
        {
            userActions.LogConsoleMessage(TestContext.CurrentContext.Test.MethodName!);
            userActions.LogConsoleMessage("Set Up : ");
            userActions.LogConsoleMessage("Remove any leftover 'UpdateExpectation2' from a prior run (idempotent start)");
            PurgeTestCasesByName("UpdateExpectation2");
            Actor.AttemptsTo(CreatTestCase.For("UpdateExpectation2", "Testcase for adding 2 Steps and update"));
            
            userActions.LogConsoleMessage("Action steps : ");

            userActions.LogConsoleMessage("Click on the UpdateExpectation2 TestcaseName");
            try
            {
                SelectTestCase("UpdateExpectation2");

                userActions.LogConsoleMessage("Click on the Add Steps Button to input step 1");
                Actor.WaitsUntil(Appearance.Of(TestCases.AddStepButton), IsEqualTo.True());

                Actor.AttemptsTo(Hover.Over(TestCases.AddStepButton));
                Actor.AttemptsTo(Click.On(TestCases.AddStepButton));


                Actions actions = new Actions(driver);
                //Scroll down page
                actions.SendKeys(Keys.PageDown).Pause(TimeSpan.FromSeconds(1)).Build().Perform();

                //Steps
                Actor.AttemptsTo(WriteToIframe.For(driver, 2, "Go to Quack home page"));
                //Expectations
                Actor.AttemptsTo(WriteToIframe.For(driver, 3, "Quack login page opens"));
                //dynamic element need to wait

                userActions.LogConsoleMessage("Click on the Save Button");
                Actor.WaitsUntil(Appearance.Of(TestCases.SaveStep1), IsEqualTo.True());
                Actor.AttemptsTo(Click.On(TestCases.SaveStep1));

                // Wait for step 1 to finish saving (its text renders in display mode) before
                // adding step 2. The save is async and replaces the whole steps array with the
                // server response; if we append step 2 before it resolves, the response
                // overwrites it and the steps-1-form never renders.
                Actor.WaitsUntil(Appearance.Of(TestCases.Step1Text), IsEqualTo.True(), timeout: 45);

                //Add 2nd step
                userActions.LogConsoleMessage("Click on the Add Steps Button to input step 2");
                Actor.WaitsUntil(Appearance.Of(TestCases.AddStepButton), IsEqualTo.True());
                Actor.AttemptsTo(Hover.Over(TestCases.AddStepButton));
                Actor.AttemptsTo(Click.On(TestCases.AddStepButton));

                //Step 2
                Actor.AttemptsTo(WriteToIframe.For(driver, 4, "Login as admin"));
                //Expectations 2
                Actor.AttemptsTo(WriteToIframe.For(driver, 5, "List of projects opens"));

                //Scroll down page
                actions.SendKeys(Keys.PageDown).Pause(TimeSpan.FromSeconds(1)).Build().Perform();

                userActions.LogConsoleMessage("Click on the Save button");
                Actor.WaitsUntil(Appearance.Of(TestCases.SaveStep2), IsEqualTo.True());
                Actor.AttemptsTo(Click.On(TestCases.SaveStep2));

                //Edit ..
                userActions.LogConsoleMessage("Click on the Edit Link");
                Actor.AttemptsTo(Click.On(TestCases.EditStep2Expectations));


                userActions.LogConsoleMessage("Update the expectation in step 2 to UPD");

                //Update..Expectations 2 UPD
                Actor.AttemptsTo(WriteToIframe.For(driver, 5, " UPD"));

                //Save the changes
                userActions.LogConsoleMessage("Click on the Save Button");
                Actor.AttemptsTo(Click.On(TestCases.SaveStep2));


                //Verify
                userActions.LogConsoleMessage("Verify : In Step 2 Expectation is updated with UPD");

                driver.SwitchTo().Frame(5);
                string Expectations2Text = Actor.AskingFor(Text.Of(TestCases.RichTextBody));
                Assert.That(Expectations2Text, Is.EqualTo("UPD"));
                driver.SwitchTo().DefaultContent();
            }
            finally {
            // The verification above switches into a step iframe (SwitchTo().Frame(5)). If the body
            // throws before SwitchTo().DefaultContent() runs, the driver is left inside that frame and
            // cleanup fails with "Node with given id does not belong to the document" (and masks the
            // real failure). Always reset to the main document before deleting.
            driver.SwitchTo().DefaultContent();
            // Cleanup
            userActions.LogConsoleMessage("Clean up :");
            Actor.AttemptsTo(DeleteTestCase.For(driver));
            }
        }



        [Test]
        public void TC10AddPreconditionTestCase()
        {
            userActions.LogConsoleMessage(TestContext.CurrentContext.Test.MethodName!);
            userActions.LogConsoleMessage("Set Up : ");
            userActions.LogConsoleMessage("Create a Testcase");
            userActions.LogConsoleMessage("Remove any leftover 'PreconditionTestCase' from a prior run (idempotent start)");
            PurgeTestCasesByName("PreconditionTestCase");
            Actor.AttemptsTo(CreatTestCase.For("PreconditionTestCase", "Testcase for adding precondition"));

            userActions.LogConsoleMessage("Action steps : ");

            userActions.LogConsoleMessage("Click on the PreconditionTestCase TestcaseName");
            try
            {
                SelectTestCase("PreconditionTestCase");

                userActions.LogConsoleMessage("Click on the Preconditions edit icon");

                Actor.AttemptsTo(Hover.Over(TestCases.Preconditions));
                Actor.AttemptsTo(Hover.Over(TestCases.PreconditionsSVG));
                Actor.AttemptsTo(Click.On(TestCases.PreconditionsSVG));

                IWebLocator preconditionFrame = new WebLocator("preconditionFrame", By.XPath("//div[@id ='preconditions-form']//iframe"));
                Actor.WaitsUntil(Appearance
                    .Of(preconditionFrame), IsEqualTo.True(), timeout: 45);
                //Preconditions frame index
                Actor.AttemptsTo(WriteToIframe.For(driver, 1, "Quack has to be installed and available"));

                // scroll
                Actions actions = new Actions(driver);
                actions.SendKeys(Keys.PageDown).Pause(TimeSpan.FromSeconds(1)).Build().Perform();


                userActions.LogConsoleMessage("Click on Save button");
                Actor.WaitsUntil(Appearance.Of(TestCases.SavePreconditions), IsEqualTo.True());
                Actor.AttemptsTo(Click.On(TestCases.SavePreconditions));
                //   Thread.Sleep(2000);
                //actions.Pause(TimeSpan.FromSeconds(1)).Build();

                actions.SendKeys(Keys.PageDown).Pause(TimeSpan.FromSeconds(1)).Build().Perform();
                // Verify
                userActions.LogConsoleMessage("Verify : Precondition text contains Quack has to be installed and available");
                //string preconditionText = Actor.AskingFor(Text.Of(TestCases.PreconditionsText));
                //Assert.That(preconditionText
                //    , Is.EqualTo("Quack has to be installed and available"));
                Actor.WaitsUntil(Text.Of(TestCases.PreconditionsText), ContainsSubstring.Text("Quack has to be installed and available"));
            }
            finally { 

            userActions.LogConsoleMessage("Clean up : Delete Testcase");
            Actor.AttemptsTo(DeleteTestCase.For(driver));
            }
        }


        // Verifies that an admin can bulk-lock all test cases in Dokimion_LS and that a standard
        // user cannot see the "Lock All TestCases" button (admin-only via Utils.isAdmin check).
        [Test]
        public void TC23LockAllTestCases()
        {
            userActions.LogConsoleMessage(TestContext.CurrentContext.Test.MethodName!);

            userActions.LogConsoleMessage("Set Up : switch to Dokimion_LS TestCases");
            OpenProjectLSTestCases();

            try
            {
                userActions.LogConsoleMessage("Action steps : admin clicks Lock All TestCases");
                Actor.WaitsUntil(Appearance.Of(TestCases.LockAllTestCasesButton), IsEqualTo.True(), timeout: 60);
                Actor.AttemptsTo(Click.On(TestCases.LockAllTestCasesButton));

                userActions.LogConsoleMessage("Verify : confirmation popup appears");
                Actor.WaitsUntil(Text.Of(TestCases.BulkAttributeMessage), ContainsSubstring.Text("Locked All Testcases"), timeout: 60);

                userActions.LogConsoleMessage("Switch to Tester to verify locked-state restrictions");
                try
                {
                    SwitchToNormalUser();
                    // Tester is already on the projects list with Dokimion_LS visible — click it then TestCases.
                    Actor.AttemptsTo(Click.On(Header.DokimionLaunchStatisticsProject));
                    Actor.WaitsUntil(Appearance.Of(Header.TestCases), IsEqualTo.True(), timeout: 30);
                    Actor.AttemptsTo(Click.On(Header.TestCases));
                    Actor.WaitsUntil(TextList.For(TestCases.GetTestCaseNameList), IsAnEnumerable<string>.WhereTheCount(IsGreaterThanOrEqualTo.Value(1)), timeout: 60);
                    Actor.WaitsUntil(Appearance.Of(TestCases.LockAllTestCasesButton), IsEqualTo.False(), timeout: 15);
                    userActions.LogConsoleMessage("Verified: normal user does not see Lock All TestCases button");

                    userActions.LogConsoleMessage("Attempt : open 'Validate login' and try to add 'lock dummy' text to description");
                    OpenTestCaseInLS("Validate login");

                    // Hover over the Description card header to trigger the same hover state a real
                    // user would use — the pencil edit icon is CSS-hidden until hover. For Tester
                    // the span is never rendered (!readonly guard in React), so it stays absent
                    // even after the hover that would reveal it for an admin.
                    IWebLocator descriptionHeader = new WebLocator("DescriptionHeader",
                        By.XPath("//div[@id='description']//h5"));
                    Actor.WaitsUntil(Appearance.Of(descriptionHeader), IsEqualTo.True(), timeout: 30);
                    Actor.AttemptsTo(Hover.Over(descriptionHeader));

                    IWebLocator descriptionEditPencil = new WebLocator("DescriptionEditPencil",
                        By.XPath("//div[@id='description']//span[contains(@class,'edit-icon')]"));
                    Actor.WaitsUntil(Appearance.Of(descriptionEditPencil), IsEqualTo.False(), timeout: 5);
                    userActions.LogConsoleMessage("Observe : description edit pencil absent after hover — cannot enter edit mode");

                    IWebLocator descriptionSaveButton = new WebLocator("DescriptionSaveButton",
                        By.XPath("//div[@id='description-form']//button[text()='Save']"));
                    Actor.WaitsUntil(Appearance.Of(descriptionSaveButton), IsEqualTo.False(), timeout: 5);
                    userActions.LogConsoleMessage("Verified: 'lock dummy' text cannot be added — description Save button is absent on locked test case");
                }
                finally
                {
                    RestoreAdminSession();
                }
            }
            finally
            {
                userActions.LogConsoleMessage("Clean up : unlock all test cases");
                try
                {
                    OpenProjectLSTestCases();
                    Actor.AttemptsTo(Click.On(TestCases.UnlockAllTestCasesButton));
                    Actor.WaitsUntil(Text.Of(TestCases.BulkAttributeMessage), ContainsSubstring.Text("Unlocked All Testcases"), timeout: 60);
                }
                catch (Exception ex) { userActions.LogConsoleMessage("Cleanup (Unlock All) failed (ignored): " + ex); }
            }
        }

        // Verifies that an admin can bulk-unlock all test cases in Dokimion_LS and that a standard
        // user cannot see the "Unlock All TestCases" button (admin-only via Utils.isAdmin check).
        [Test]
        public void TC24UnlockAllTestCases()
        {
            userActions.LogConsoleMessage(TestContext.CurrentContext.Test.MethodName!);

            userActions.LogConsoleMessage("Set Up : switch to Dokimion_LS TestCases");
            OpenProjectLSTestCases();

            try
            {
                userActions.LogConsoleMessage("Arrange : lock all test cases so there is something to unlock");
                Actor.WaitsUntil(Appearance.Of(TestCases.LockAllTestCasesButton), IsEqualTo.True(), timeout: 60);
                Actor.AttemptsTo(Click.On(TestCases.LockAllTestCasesButton));
                Actor.WaitsUntil(Text.Of(TestCases.BulkAttributeMessage), ContainsSubstring.Text("Locked All Testcases"), timeout: 60);

                userActions.LogConsoleMessage("Action steps : admin clicks Unlock All TestCases");
                OpenProjectLSTestCases();
                Actor.WaitsUntil(Appearance.Of(TestCases.UnlockAllTestCasesButton), IsEqualTo.True(), timeout: 60);
                Actor.AttemptsTo(Click.On(TestCases.UnlockAllTestCasesButton));

                userActions.LogConsoleMessage("Verify : confirmation popup appears");
                Actor.WaitsUntil(Text.Of(TestCases.BulkAttributeMessage), ContainsSubstring.Text("Unlocked All Testcases"), timeout: 60);

                userActions.LogConsoleMessage("Verify : individual test case shows Lock Testcase button (unlocked state)");
                OpenProjectLSTestCases();
                OpenTestCaseInLS("Validate login");
                Actor.WaitsUntil(Appearance.Of(TestCases.LockTestcaseButton), IsEqualTo.True(), timeout: 30);
                userActions.LogConsoleMessage("Verified: 'Validate login' shows Lock Testcase button — test case is unlocked");

                userActions.LogConsoleMessage("Verify : normal user cannot see Unlock All TestCases button");
                try
                {
                    SwitchToNormalUser();
                    // Tester is already on the projects list with Dokimion_LS visible — click it then TestCases.
                    Actor.AttemptsTo(Click.On(Header.DokimionLaunchStatisticsProject));
                    Actor.WaitsUntil(Appearance.Of(Header.TestCases), IsEqualTo.True(), timeout: 30);
                    Actor.AttemptsTo(Click.On(Header.TestCases));
                    Actor.WaitsUntil(TextList.For(TestCases.GetTestCaseNameList), IsAnEnumerable<string>.WhereTheCount(IsGreaterThanOrEqualTo.Value(1)), timeout: 60);
                    Actor.WaitsUntil(Appearance.Of(TestCases.UnlockAllTestCasesButton), IsEqualTo.False(), timeout: 15);
                    userActions.LogConsoleMessage("Verified: normal user does not see Unlock All TestCases button");

                    userActions.LogConsoleMessage("Verify : normal user does not see Lock Testcase button on individual test case");
                    OpenTestCaseInLS("Validate login");
                    // LockTestcaseButton is guarded by !readonly && Utils.isAdmin(session). Both
                    // conditions depend on the async getSession() call settling — allow 30s.
                    Actor.WaitsUntil(Appearance.Of(TestCases.LockTestcaseButton), IsEqualTo.False(), timeout: 30);
                    userActions.LogConsoleMessage("Verified: normal user does not see Lock Testcase button");
                }
                finally
                {
                    RestoreAdminSession();
                }
            }
            finally
            {
                userActions.LogConsoleMessage("Clean up : ensure all test cases are unlocked");
                try
                {
                    OpenProjectLSTestCases();
                    Actor.AttemptsTo(Click.On(TestCases.UnlockAllTestCasesButton));
                    Actor.WaitsUntil(Text.Of(TestCases.BulkAttributeMessage), ContainsSubstring.Text("Unlocked All Testcases"), timeout: 60);
                }
                catch (Exception ex) { userActions.LogConsoleMessage("Cleanup (Unlock All) failed (ignored): " + ex); }
            }
        }

        // Creates a temporary test case and then deletes it, verifying it no longer appears in the
        // test-case tree. The create/delete round trip leaves the project exactly as it started.
        [Test]
        public void TC25RemoveTestCase()
        {
            userActions.LogConsoleMessage(TestContext.CurrentContext.Test.MethodName!);

            userActions.LogConsoleMessage("Set Up : create a temporary test case to delete");
            Actor.AttemptsTo(CreatTestCase.For("TempDeleteTestCase", "Temporary test case created to verify deletion"));

            userActions.LogConsoleMessage("Action steps : ");
            bool deleted = false;
            try
            {
                userActions.LogConsoleMessage("Select the temporary test case and confirm it was created");
                string tcName = SelectTestCase("TempDeleteTestCase");
                StringAssert.Contains("TempDeleteTestCase", tcName);

                userActions.LogConsoleMessage("Click on the Remove Testcase button to delete it");
                Actor.AttemptsTo(DeleteTestCase.For(driver));
                deleted = true;

                userActions.LogConsoleMessage("Verify : the temporary test case is no longer listed");
                Actor.AttemptsTo(Click.On(Header.TestCases));
                Actor.WaitsUntil(TextList.For(TestCases.GetTestCaseNameList), IsAnEnumerable<string>.WhereTheCount(IsGreaterThanOrEqualTo.Value(1)), timeout: 60);

                IWebLocator deletedTestCase = new WebLocator("DeletedTestCase",
                    By.XPath("//span[@data-role='display' and normalize-space()='TempDeleteTestCase']"));
                Actor.WaitsUntil(Appearance.Of(deletedTestCase), IsEqualTo.False(), timeout: 60);
                userActions.LogConsoleMessage("Verified: TempDeleteTestCase has been deleted");
            }
            finally
            {
                // The delete IS the action under test, so only clean up if it never ran (the test
                // failed earlier) - otherwise the temp case would leak and pollute later runs.
                // Best-effort; never fail the test from cleanup.
                if (!deleted)
                {
                    userActions.LogConsoleMessage("Clean up : remove the leaked temporary test case");
                    try
                    {
                        SelectTestCase("TempDeleteTestCase");
                        Actor.AttemptsTo(DeleteTestCase.For(driver));
                    }
                    catch (Exception ex) { userActions.LogConsoleMessage("Cleanup (Delete temp test case) failed (ignored): " + ex); }
                }
            }
        }

        // Verifies that the "Remove Testcase" button is gated by role for non-admin users. React
        // renders it only when !readonly (TestCase.js), and the session role decides readonly:
        //   - Tester (Username/Password) is a write-capable developer role -> readonly = false -> the
        //     Remove Testcase button IS shown (Tester creates suites/launches in TC16-20).
        //   - NormalTester is a read-only TESTER/OBSERVERONLY role -> readonly = true -> the button is
        //     NOT shown, so this user cannot delete a test case.
        // Admin delete is covered by TC25. The admin session is restored at the end so later tests
        // are unaffected.
        [Test]
        public void TC26RemoveTestCaseHiddenButton()
        {
            userActions.LogConsoleMessage(TestContext.CurrentContext.Test.MethodName!);

            try
            {
                AssertRemoveTestCaseButtonVisibilityAs("Tester", userActions.Username!, userActions.Password!, expectVisible: true);
                AssertRemoveTestCaseButtonVisibilityAs("NormalTester", userActions.NormalTester!, userActions.NormalTesterPasswd!, expectVisible: false);
            }
            finally
            {
                userActions.LogConsoleMessage("Clean up : restore the admin session");
                RestoreAdminSession();
            }
        }

        // Verifies locking an individual test case. As admin, locks the first test case in
        // Dokimion_LS and confirms the admin then sees the "Unlock Testcase" button on it (the lock
        // toggled, so the Lock button is replaced by Unlock). Then logs in as Tester and NormalTester
        // and confirms neither can see the "Unlock Testcase" button on that same locked test case -
        // both lock/unlock buttons are admin-only (!readonly && Utils.isAdmin && testcase.locked in
        // TestCase.js). The test case is unlocked again in cleanup so the project is left as it started.
        [Test]
        public void TC27LockUnlockIndividualTestCase()
        {
            userActions.LogConsoleMessage(TestContext.CurrentContext.Test.MethodName!);

            // Lock a known, stable test case rather than "whatever is first in the tree". Capturing
            // the first node's full text was unreliable: it can include a count/badge (e.g. "(1)") or
            // a group prefix that then fails to round-trip through OpenTestCaseInLS. OpenTestCaseInLS
            // does a case-insensitive CONTAINS match, so "Validate login" reliably opens the node -
            // the same test case TC23/TC24 drive the lock UI against.
            const string testCaseName = "Validate login";
            bool locked = false;
            try
            {
                userActions.LogConsoleMessage("Set Up : open Dokimion_LS TestCases as admin");
                OpenProjectLSTestCases();

                userActions.LogConsoleMessage($"Action steps : admin opens '{testCaseName}' and locks it");
                OpenTestCaseInLS(testCaseName);
                LockOpenTestCase();
                locked = true;

                // Locking navigates back to the list, so re-open the now-locked test case to inspect it.
                userActions.LogConsoleMessage("Verify : admin sees the Unlock Testcase button on the locked test case");
                Actor.WaitsUntil(TextList.For(TestCases.GetTestCaseNameList), IsAnEnumerable<string>.WhereTheCount(IsGreaterThanOrEqualTo.Value(1)), timeout: 60);
                OpenTestCaseInLS(testCaseName);
                new Actions(driver).SendKeys(Keys.PageDown).Pause(TimeSpan.FromSeconds(1)).Build().Perform();
                Actor.WaitsUntil(Appearance.Of(TestCases.UnlockTestcaseButton), IsEqualTo.True(), timeout: 30);
                userActions.LogConsoleMessage("Verified: admin sees the Unlock Testcase button");

                AssertUnlockButtonHiddenAs("Tester", userActions.Username!, userActions.Password!, testCaseName);
                AssertUnlockButtonHiddenAs("NormalTester", userActions.NormalTester!, userActions.NormalTesterPasswd!, testCaseName);
            }
            finally
            {
                userActions.LogConsoleMessage("Clean up : restore admin and unlock the test case");
                RestoreAdminSession();
                if (locked)
                {
                    try
                    {
                        OpenProjectLSTestCases();
                        OpenTestCaseInLS(testCaseName);
                        UnlockOpenTestCase();
                    }
                    catch (Exception ex) { userActions.LogConsoleMessage("Cleanup (Unlock test case) failed (ignored): " + ex); }
                }
            }
        }

        // Verifies the test-case full-text Search. Opens Dokimion_LS (admin session from Setup), types
        // "Filter" in the Search box, clicks the funnel (Filter) button, and confirms the "Filter
        // testcase" test case is shown in the filtered tree. Cleanup clears the Search filter so the
        // Dokimion_LS tree is left unfiltered, exactly as it started.
        [Test]
        public void TC28SearchTestCase()
        {
            userActions.LogConsoleMessage(TestContext.CurrentContext.Test.MethodName!);

            userActions.LogConsoleMessage("Set Up : select the Dokimion_LS project and open TestCases");
            OpenProjectLSTestCases();

            try
            {
                userActions.LogConsoleMessage("Action steps : type 'Filter' in the Search box");
                Actor.WaitsUntil(Appearance.Of(TestCases.SearchInput), IsEqualTo.True(), timeout: 30);
                Actor.AttemptsTo(Clear.On(TestCases.SearchInput));
                Actor.AttemptsTo(SendKeys.To(TestCases.SearchInput, "Filter"));

                userActions.LogConsoleMessage("Click the funnel (Filter) button");
                Actor.AttemptsTo(Hover.Over(TestCases.FilterLocator));
                Actor.AttemptsTo(Click.On(TestCases.FilterLocator));

                userActions.LogConsoleMessage("Verify : the 'Filter testcase' test case is displayed");
                IWebLocator filterTestCase = new WebLocator("FilterTestCase",
                    By.XPath("//span[@data-role='display' and contains(translate(normalize-space(),'ABCDEFGHIJKLMNOPQRSTUVWXYZ','abcdefghijklmnopqrstuvwxyz'),'filter testcase')]"));
                Actor.WaitsUntil(Appearance.Of(filterTestCase), IsEqualTo.True(), timeout: 60);
                userActions.LogConsoleMessage("Verified: 'Filter testcase' is displayed in the search results");
            }
            finally
            {
                // Clean up : clear the Search box and re-run the filter so the tree shows all test
                // cases again. Best-effort - never fail the test from cleanup.
                userActions.LogConsoleMessage("Clean up : clear the Search filter");
                try
                {
                    Actor.AttemptsTo(Clear.On(TestCases.SearchInput));
                    Actor.AttemptsTo(Hover.Over(TestCases.FilterLocator));
                    Actor.AttemptsTo(Click.On(TestCases.FilterLocator));
                }
                catch (Exception ex) { userActions.LogConsoleMessage("Cleanup (reset search) failed (ignored): " + ex); }
            }
        }

        // Lock the currently-open test case via its admin-only "Lock Testcase" ConfirmButton. The
        // button renders two <a>Lock Testcase</a> elements (the trigger and the modal-footer confirm,
        // see ConfirmButton.js), so click the trigger first, then the confirm in the modal footer.
        // lockTestcase() navigates back to the test-case list, so wait for that before returning.
        private void LockOpenTestCase()
        {
            new Actions(driver).SendKeys(Keys.PageDown).Pause(TimeSpan.FromSeconds(1)).Build().Perform();

            // Already locked (e.g. left over from an aborted run)? Then there is nothing to lock.
            if (Actor.AskingFor(Appearance.Of(TestCases.UnlockTestcaseButton))) return;

            Actor.WaitsUntil(Appearance.Of(TestCases.LockTestcaseButton), IsEqualTo.True(), timeout: 30);
            Actor.AttemptsTo(Click.On(TestCases.LockTestcaseButton));

            IWebLocator confirmLock = new WebLocator("ConfirmLockTestcase",
                By.XPath("//div[@class='modal-footer']//a[normalize-space()='Lock Testcase']"));
            Actor.WaitsUntil(Appearance.Of(confirmLock), IsEqualTo.True(), timeout: 30);
            Actor.AttemptsTo(Hover.Over(confirmLock));
            Actor.AttemptsTo(Click.On(confirmLock));

            Actor.WaitsUntil(Appearance.Of(Header.TestCases), IsEqualTo.True(), timeout: 60);
        }

        // Unlock the currently-open test case via its admin-only "Unlock Testcase" ConfirmButton
        // (same two-<a> trigger/confirm shape as LockOpenTestCase). unlockTestcase() navigates back
        // to the test-case list, so wait for that before returning.
        private void UnlockOpenTestCase()
        {
            new Actions(driver).SendKeys(Keys.PageDown).Pause(TimeSpan.FromSeconds(1)).Build().Perform();
            Actor.WaitsUntil(Appearance.Of(TestCases.UnlockTestcaseButton), IsEqualTo.True(), timeout: 30);
            Actor.AttemptsTo(Click.On(TestCases.UnlockTestcaseButton));

            IWebLocator confirmUnlock = new WebLocator("ConfirmUnlockTestcase",
                By.XPath("//div[@class='modal-footer']//a[normalize-space()='Unlock Testcase']"));
            Actor.WaitsUntil(Appearance.Of(confirmUnlock), IsEqualTo.True(), timeout: 30);
            Actor.AttemptsTo(Hover.Over(confirmUnlock));
            Actor.AttemptsTo(Click.On(confirmUnlock));

            Actor.WaitsUntil(Appearance.Of(Header.TestCases), IsEqualTo.True(), timeout: 60);
        }

        // Log in as the given non-admin user, open the named (locked) test case in Dokimion_LS, and
        // assert the "Unlock Testcase" button is NOT shown (lock/unlock is admin-only).
        private void AssertUnlockButtonHiddenAs(string label, string username, string password, string testcaseName)
        {
            userActions.LogConsoleMessage($"Log in as {label} and open the locked test case '{testcaseName}'");
            LoginAsNonAdmin(username, password);

            Actor.AttemptsTo(Click.On(Header.DokimionLaunchStatisticsProject));
            Actor.WaitsUntil(Appearance.Of(Header.TestCases), IsEqualTo.True(), timeout: 30);
            Actor.AttemptsTo(Click.On(Header.TestCases));
            Actor.WaitsUntil(TextList.For(TestCases.GetTestCaseNameList), IsAnEnumerable<string>.WhereTheCount(IsGreaterThanOrEqualTo.Value(1)), timeout: 60);

            OpenTestCaseInLS(testcaseName);

            // Confirm the test-case detail loaded (Description renders for every role) so the absence
            // check below is meaningful and not just an unrendered page.
            IWebLocator descriptionHeader = new WebLocator("DescriptionHeader", By.XPath("//div[@id='description']//h5"));
            Actor.WaitsUntil(Appearance.Of(descriptionHeader), IsEqualTo.True(), timeout: 30);
            new Actions(driver).SendKeys(Keys.PageDown).Pause(TimeSpan.FromSeconds(1)).Build().Perform();

            userActions.LogConsoleMessage($"Verify : Unlock Testcase button is NOT visible for {label}");
            Actor.WaitsUntil(Appearance.Of(TestCases.UnlockTestcaseButton), IsEqualTo.False(), timeout: 30);
            userActions.LogConsoleMessage($"Verified: {label} cannot see the Unlock Testcase button on the locked test case");
        }

        // Log in as the given non-admin user, open the "Validate login" test case in Dokimion_LS, and
        // assert whether the "Remove Testcase" button is shown (expectVisible) — i.e. whether the user
        // is allowed to delete a test case.
        private void AssertRemoveTestCaseButtonVisibilityAs(string label, string username, string password, bool expectVisible)
        {
            userActions.LogConsoleMessage($"Log in as {label} and open Dokimion_LS TestCases");
            LoginAsNonAdmin(username, password);

            Actor.AttemptsTo(Click.On(Header.DokimionLaunchStatisticsProject));
            Actor.WaitsUntil(Appearance.Of(Header.TestCases), IsEqualTo.True(), timeout: 30);
            Actor.AttemptsTo(Click.On(Header.TestCases));
            Actor.WaitsUntil(TextList.For(TestCases.GetTestCaseNameList), IsAnEnumerable<string>.WhereTheCount(IsGreaterThanOrEqualTo.Value(1)), timeout: 60);

            userActions.LogConsoleMessage($"Select a test case as {label}");
            OpenTestCaseInLS("Validate login");

            // Confirm the test-case detail actually loaded (the Description section renders for every
            // role) so the visibility check below is meaningful and not just an unrendered page.
            IWebLocator descriptionHeader = new WebLocator("DescriptionHeader", By.XPath("//div[@id='description']//h5"));
            Actor.WaitsUntil(Appearance.Of(descriptionHeader), IsEqualTo.True(), timeout: 30);

            // readonly is applied asynchronously once the session loads, so the button can flash on/off
            // during settle; WaitsUntil polls until it reaches the expected state and holds there.
            if (expectVisible)
            {
                userActions.LogConsoleMessage($"Verify : Remove Testcase button IS present for {label} (can delete)");
                Actor.WaitsUntil(Appearance.Of(TestCases.RemoveTestCase), IsEqualTo.True(), timeout: 30);
                userActions.LogConsoleMessage($"Verified: {label} sees the Remove Testcase button");
            }
            else
            {
                userActions.LogConsoleMessage($"Verify : Remove Testcase button is NOT present for {label} (cannot delete)");
                Actor.WaitsUntil(Appearance.Of(TestCases.RemoveTestCase), IsEqualTo.False(), timeout: 30);
                userActions.LogConsoleMessage($"Verified: {label} cannot delete the test case (Remove Testcase button absent)");
            }
        }

        // Log out whoever is logged in and log in as the given non-admin user. After login the user
        // lands on the projects list with Dokimion_LS visible (non-admins cannot see the Dokimion
        // project, so navigation into a project is the caller's responsibility).
        private void LoginAsNonAdmin(string username, string password)
        {
            try { Actor.AttemptsTo(Logout.For()); } catch { /* may already be on login page */ }
            Actor.WaitsUntil(Appearance.Of(LoginPage.NameInput), IsEqualTo.True(), timeout: 30);
            Actor.AttemptsTo(LoginUser.For(username, password));
            Actor.WaitsUntil(Appearance.Of(Header.DokimionLaunchStatisticsProject), IsEqualTo.True(), timeout: 15);
        }

        // ----- helpers for TC23 / TC24 -----

        // Navigate from the current project to Dokimion_LS and open its TestCases page.
        private void OpenProjectLSTestCases()
        {
            Actor.AttemptsTo(Click.On(Header.ProjectsLink));
            Actor.WaitsUntil(Appearance.Of(Header.AllLink), IsEqualTo.True(), timeout: 30);
            Actor.AttemptsTo(Click.On(Header.AllLink));
            Actor.WaitsUntil(Appearance.Of(Header.DokimionLaunchStatisticsProject), IsEqualTo.True(), timeout: 30);
            Actor.AttemptsTo(Click.On(Header.DokimionLaunchStatisticsProject));
            Actor.WaitsUntil(Appearance.Of(Header.TestCases), IsEqualTo.True(), timeout: 30);
            Actor.AttemptsTo(Click.On(Header.TestCases));
            Actor.WaitsUntil(TextList.For(TestCases.GetTestCaseNameList), IsAnEnumerable<string>.WhereTheCount(IsGreaterThanOrEqualTo.Value(1)), timeout: 60);
        }

        // Open a test case by name in the currently displayed Dokimion_LS tree.
        private void OpenTestCaseInLS(string testcaseName)
        {
            string xpath = $"//span[@data-role='display' and contains(translate(normalize-space(),'ABCDEFGHIJKLMNOPQRSTUVWXYZ','abcdefghijklmnopqrstuvwxyz'),'{testcaseName.ToLower()}')]";
            IWebLocator tc = new WebLocator("TestCase:" + testcaseName, By.XPath(xpath));
            Actor.WaitsUntil(Appearance.Of(tc), IsEqualTo.True(), timeout: 60);
            new Actions(driver).MoveToElement(tc.FindElement(driver)).Click().Build().Perform();
        }

        // Log out the current user and log in as the standard (non-admin) test user.
        // After login Tester lands on the projects list showing only Dokimion_LS —
        // the Dokimion project is not accessible to Tester so Header.DokimionProject
        // is never present. Navigation into the project is the caller's responsibility.
        private void SwitchToNormalUser()
        {
            Actor.AttemptsTo(Logout.For());
            Actor.WaitsUntil(Appearance.Of(LoginPage.NameInput), IsEqualTo.True(), timeout: 30);
            Actor.AttemptsTo(LoginUser.For(userActions.NormalTester!, userActions.NormalTesterPasswd!));
            Actor.WaitsUntil(Appearance.Of(Header.DokimionLaunchStatisticsProject), IsEqualTo.True(), timeout: 15);
        }

        // Log out whoever is logged in and restore the admin session used by the rest of the class.
        private void RestoreAdminSession()
        {
            try { Actor.AttemptsTo(Logout.For()); } catch { /* may already be on login page */ }
            Actor.WaitsUntil(Appearance.Of(LoginPage.NameInput), IsEqualTo.True(), timeout: 30);
            Actor.AttemptsTo(LoginUser.For(userActions.AdminUser!, userActions.AdminPass!));
            Actor.WaitsUntil(Appearance.Of(Header.DokimionProject), IsEqualTo.True(), timeout: 15);
            Actor.AttemptsTo(Click.On(Header.DokimionProject));
        }

        public void RemoveStep()
        {

            userActions.LogConsoleMessage("Click on the Remove Step");
            Actions actions = new Actions(driver);
            actions.SendKeys(Keys.PageDown).Pause(TimeSpan.FromSeconds(1)).Build().Perform();


            Actor.WaitsUntil(Appearance.Of(TestCases.RemoveStep1), IsEqualTo.True(), timeout: 45);
            Actor.AttemptsTo(Click.On(TestCases.RemoveStep1));

            //Confirm pop up is displayed
            Actor.WaitsUntil(Appearance.Of(TestCases.RemoveStep1Confirm), IsEqualTo.True(), timeout:45);
            Actor.WaitsUntil(Appearance.Of(TestCases.FinalRemoveStep1), IsEqualTo.True(), timeout:45);

            userActions.LogConsoleMessage("Click on the Remove Step Confirmation");

            Actor.AttemptsTo(Hover.Over(TestCases.FinalRemoveStep1));
            TestCases.FinalRemoveStep1.FindElement(driver).Click();
            
        }
    
        // Idempotent setup: delete any pre-existing test cases whose name contains the given text
        // (leftovers from an aborted prior run). TC08-TC10 create same-named test cases and
        // SelectTestCase picks the LAST match, so a leftover that already has a step shifts the
        // WriteToIframe indices and hides SaveStep1 (the 45s timeout documented on TC08). Purging
        // first guarantees only the fresh test case exists. Runs in the current project's TestCases.
        private void PurgeTestCasesByName(string testcaseName)
        {
            // FadeLoader inside .sweet-loading renders only while the tree is loading (see TestCases.js).
            IWebLocator treeLoading = new WebLocator("TestCaseTreeLoading",
                By.XPath("//div[contains(@class,'sweet-loading')]//span"));

            for (int attempt = 0; attempt < 10; attempt++)
            {
                // (Re)load the list each pass so a fresh, non-stale set of nodes is queried. The delete
                // reload (or any tree re-render) otherwise leaves stale element references, which
                // surface as "Node with given id does not belong to the document". Wait for the fetch
                // to finish via the spinner - the project may legitimately have no matching test cases.
                Actor.AttemptsTo(Click.On(Header.TestCases));
                Actor.WaitsUntil(Appearance.Of(treeLoading), IsEqualTo.False(), timeout: 60);
                new Actions(driver).Pause(TimeSpan.FromSeconds(1)).Build().Perform();

                IWebElement match;
                try
                {
                    match = TestCases.GetTestCaseNameList.FindElements(driver)
                        .FirstOrDefault(e => e.Text.Contains(testcaseName));
                }
                catch (StaleElementReferenceException) { continue; }

                if (match == null) return; // none left

                try
                {
                    new Actions(driver).MoveToElement(match).Click().Build().Perform();
                    Actor.AttemptsTo(DeleteTestCase.For(driver));
                }
                catch (Exception ex)
                {
                    // The delete (Remove + confirm) may have succeeded even if the post-delete reload
                    // wait threw a transient stale-node error; the next pass reloads and re-checks.
                    userActions.LogConsoleMessage("Purge delete hit a transient error (will re-check): " + ex.Message);
                }
            }
        }

        // Select a test case in the tree and return its name text. Waits for the SPECIFIC test
        // case to appear (after a create/reload it may not be listed immediately), re-queries on
        // stale re-renders, then moves to the node (scrolling it into view, like a user) and
        // clicks it.
        private string SelectTestCase(string testcasename)
        {
            Actor.WaitsUntil(TextList.For(TestCases.GetTestCaseNameList), IsAnEnumerable<string>.WhereTheCount(IsGreaterThanOrEqualTo.Value(1)), timeout: 60);

            for (int attempt = 0; attempt < 60; attempt++)
            {
                try
                {
                    IWebElement match = TestCases.GetTestCaseNameList.FindElements(driver)
                        .LastOrDefault(name => name.Text.Contains(testcasename));
                    if (match != null)
                    {
                        string text = match.Text;
                        new Actions(driver).MoveToElement(match).Click().Build().Perform();
                        userActions.LogConsoleMessage("Selected Testcase : " + text);
                        return text;
                    }
                }
                catch (StaleElementReferenceException)
                {
                    // Tree re-rendered between query and use; re-query on the next pass.
                }
                new Actions(driver).Pause(TimeSpan.FromSeconds(1)).Build().Perform();
            }
            throw new NoSuchElementException("Test case not found in tree: " + testcasename);
        }


    }
}
