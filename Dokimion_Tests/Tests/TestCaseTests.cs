using Boa.Constrictor.Screenplay;
using Boa.Constrictor.Selenium;
using Dokimion.Interactions;
using Dokimion.Pages;
using OpenQA.Selenium;
using OpenQA.Selenium.Chrome;
using OpenQA.Selenium.Interactions;
using System;
using System.Collections.ObjectModel;

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
            // Selenium Manager (built into Selenium 4.9+) auto-resolves the matching chromedriver.
            // WebDriverManager was removed: its .NET assembly is blocked by Windows Smart App Control.


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

                // Verify against step 2's display text in the MAIN document instead of switching
                // into the editor iframe. No frame switching means a mismatch fails cleanly (with a
                // readable diff) and can never leave the driver stuck in a frame to break cleanup.
                // The expectation is the 2nd ".card-text" in steps-1-display (after the action one).
                IWebLocator step2ExpectationDisplay = new WebLocator(
                    "Step2ExpectationDisplay",
                    By.XPath("(//div[@id='steps-1-display']//div[@class='card-text'])[2]"));
                Actor.WaitsUntil(Text.Of(step2ExpectationDisplay), ContainsSubstring.Text("UPD"), timeout: 45);
            }
            finally {
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
                // Re-navigate to load a SETTLED tree. Reading every node's text immediately after the
                // lock races the gijgo tree rebuild and throws "Node ... does not belong to the
                // document"; a fresh navigation (as used at set-up) loads the tree cleanly.
                OpenProjectLSTestCases();
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

        // Verifies the "Load more" pagination of the test-case tree in the paratext2 project (which
        // has well over 50 test cases). The tree fetches TC_FETCH_LIMIT (50) at a time: the first
        // display shows 50 with a "Load more" link, each click appends the next 50 (cumulative
        // 100, 150, ...), and the final display appends fewer than 50 test cases after which the
        // "Load more" link disappears.
        [Test]
        public void TC29LoadMoreTestCases()
        {
            userActions.LogConsoleMessage(TestContext.CurrentContext.Test.MethodName!);

            const int PageSize = 50;

            // Pre-check : a project with fewer than 50 test cases (Dokimion_LS) must NOT show the
            // "Load more" link at all.
            userActions.LogConsoleMessage("Pre-check : select the Dokimion_LS project and open TestCases");
            OpenProjectLSTestCases();
            userActions.LogConsoleMessage("Verify : 'Load more' link is NOT displayed for Dokimion_LS (< 50 test cases)");
            Actor.WaitsUntil(Appearance.Of(TestCases.LoadMore), IsEqualTo.False(), timeout: 30);
            userActions.LogConsoleMessage("Verified: no 'Load more' link is displayed for Dokimion_LS");

            userActions.LogConsoleMessage("Set Up : select the paratext2 project and open TestCases");
            OpenParatext2TestCases();

            // First display : exactly 50 test cases, and a "Load more" link because paratext2 has >50.
            Actor.WaitsUntil(Count.Of(TestCases.GetTestCaseNameList), IsEqualTo.Value(PageSize), timeout: 60);
            int shown = CountDisplayedTestCases();
            userActions.LogConsoleMessage($"Verify : first display contains {PageSize} test cases (actual {shown})");
            Assert.That(shown, Is.EqualTo(PageSize), $"First display should contain exactly {PageSize} test cases");
            Actor.WaitsUntil(Appearance.Of(TestCases.LoadMore), IsEqualTo.True(), timeout: 30);
            userActions.LogConsoleMessage($"Verified: {PageSize} test cases shown and 'Load more' is present");

            // Click "Load more" repeatedly. A full page adds exactly 50 (cumulative 100, 150, ...) and
            // keeps the link; the final page adds fewer than 50 and the link disappears once every
            // test case is loaded. Loop ends when "Load more" is gone.
            int display = 1;
            while (Actor.AskingFor(Appearance.Of(TestCases.LoadMore)))
            {
                int before = CountDisplayedTestCases();
                display++;

                userActions.LogConsoleMessage($"Action : click 'Load more' for display #{display} (currently {before} shown)");
                ClickWithRetry(TestCases.LoadMore);
                // Give the tree a moment to fetch/merge the next page before the next action.
                new Actions(driver).Pause(TimeSpan.FromSeconds(1)).Build().Perform();

                // The tree re-renders with the merged (cumulative) set, so wait for it to grow.
                Actor.WaitsUntil(Count.Of(TestCases.GetTestCaseNameList), IsGreaterThanOrEqualTo.Value(before + 1), timeout: 60);
                int after = CountDisplayedTestCases();
                int batch = after - before;

                userActions.LogConsoleMessage($"Display #{display}: added {batch} test cases (now {after} total)");
                Assert.That(batch, Is.LessThanOrEqualTo(PageSize), $"A single 'Load more' must never add more than {PageSize} test cases");

                if (batch < PageSize)
                {
                    // Last display : fewer than 50 added => all test cases are loaded, so the
                    // "Load more" link must disappear.
                    userActions.LogConsoleMessage($"Verify : last display added {batch} (< {PageSize}) test cases - 'Load more' should disappear");
                    Actor.WaitsUntil(Appearance.Of(TestCases.LoadMore), IsEqualTo.False(), timeout: 30);
                    userActions.LogConsoleMessage($"Verified: final display added {batch} test cases and 'Load more' is gone (total {after})");
                    break;
                }

                // Full page : exactly 50 were added. If the total happens to be an exact multiple of
                // 50 the link is now gone and the while-condition ends the loop; otherwise continue.
                Assert.That(batch, Is.EqualTo(PageSize), $"A full display should add exactly {PageSize} test cases");
            }
        }

        // Editing an existing test step must not move the caret: when the user clicks into the middle
        // of a saved step's text and types, the character is inserted at the caret and the caret
        // advances by exactly one — it must NOT jump to the start or end of the field. (A controlled
        // component that re-sets the editor content on every change is the classic cause of the caret
        // jumping to the end.) Creates a test case, adds and saves a step with known content, re-opens
        // it via Edit, then drives TinyMCE's own selection API to place the caret mid-text, insert one
        // character, and assert the caret stayed put. Any leftover 'CursorNotMoveTestCase' is purged at
        // the start of the test (idempotent) and the created test case is left in place afterwards.
        [Test]
        public void TC30EditTestStepCursorNotMove()
        {
            userActions.LogConsoleMessage(TestContext.CurrentContext.Test.MethodName!);
            userActions.LogConsoleMessage("Set Up : ");
            userActions.LogConsoleMessage("Remove any leftover 'CursorNotMoveTestCase' from a prior run (idempotent start)");
            PurgeTestCasesByName("CursorNotMoveTestCase");
            Actor.AttemptsTo(CreatTestCase.For("CursorNotMoveTestCase", "Testcase verifying the edit-step caret does not jump"));

            const string StepText = "Cursor position test content";

            Actions actions = new Actions(driver);
            SelectTestCase("CursorNotMoveTestCase");

            userActions.LogConsoleMessage("Add a step with known content so it can be re-opened for editing");
            Actor.WaitsUntil(Appearance.Of(TestCases.AddStepButton), IsEqualTo.True());
            Actor.AttemptsTo(Hover.Over(TestCases.AddStepButton));
            Actor.AttemptsTo(Click.On(TestCases.AddStepButton));

            actions.SendKeys(Keys.PageDown).Pause(TimeSpan.FromSeconds(1)).Build().Perform();
            //Steps (action)
            Actor.AttemptsTo(WriteToIframe.For(driver, 2, StepText));
            //Expectations
            Actor.AttemptsTo(WriteToIframe.For(driver, 3, "Expected result"));

            userActions.LogConsoleMessage("Click Save to persist the step");
            Actor.WaitsUntil(Appearance.Of(TestCases.SaveStep1), IsEqualTo.True(), timeout: 45);
            Actor.AttemptsTo(Hover.Over(TestCases.SaveStep1));
            Actor.AttemptsTo(Click.On(TestCases.SaveStep1));

            // Wait for the step to finish saving (its text renders in display mode) before re-opening it.
            IWebLocator savedStepText = new WebLocator("SavedStepText", By.XPath($"//p[normalize-space()='{StepText}']"));
            Actor.WaitsUntil(Appearance.Of(savedStepText), IsEqualTo.True(), timeout: 45);

            userActions.LogConsoleMessage("Action steps : re-open the saved step via Edit");
            actions.SendKeys(Keys.PageDown).Pause(TimeSpan.FromSeconds(1)).Build().Perform();
            Actor.WaitsUntil(Appearance.Of(TestCases.EditStep1), IsEqualTo.True(), timeout: 45);
            Actor.AttemptsTo(Click.On(TestCases.EditStep1));

            // Wait for the step's edit form (and its action editor iframe) to actually become
            // VISIBLE. The form is display:none until Edit toggles it, and a TinyMCE editor that
            // is still hidden cannot take a caret/selection - so gate the caret check on visibility.
            IWebLocator editActionIframe = new WebLocator("EditStep1ActionIframe",
                By.XPath("//div[@id='steps-0-form']//iframe[@title='Rich Text Area']"));
            Actor.WaitsUntil(Appearance.Of(editActionIframe), IsEqualTo.True(), timeout: 45);

            userActions.LogConsoleMessage("Place the caret mid-text, type one character, and read the caret position");
            var result = RunEditStepCaretCheck(StepText);

            bool hasText = result.TryGetValue("hasText", out var ht) && Convert.ToBoolean(ht);
            Assert.That(hasText, Is.True, "The re-opened step editor had no editable text to place a caret in");

            // Persist the edited step now that the 'X' has been inserted mid-word ("positi X on").
            // RunEditStepCaretCheck inserts the character at the midpoint of StepText, so the saved
            // action is StepText with an 'X' spliced in at StepText.Length/2.
            userActions.LogConsoleMessage("Save the edited test step (persist the inserted 'X')");
            Actor.WaitsUntil(Appearance.Of(TestCases.SaveStep1), IsEqualTo.True(), timeout: 45);
            Actor.AttemptsTo(Hover.Over(TestCases.SaveStep1));
            Actor.AttemptsTo(Click.On(TestCases.SaveStep1));

            string editedStepText = StepText.Insert(StepText.Length / 2, "X");
            IWebLocator editedStepDisplay = new WebLocator("EditedStepDisplay",
                By.XPath($"//p[normalize-space()='{editedStepText}']"));
            Actor.WaitsUntil(Appearance.Of(editedStepDisplay), IsEqualTo.True(), timeout: 45);
            userActions.LogConsoleMessage($"Verified: the edited step saved with the inserted 'X' ('{editedStepText}')");

            long before = Convert.ToInt64(result["before"]);
            long after = Convert.ToInt64(result["after"]);
            long total = Convert.ToInt64(result["total"]);
            userActions.LogConsoleMessage($"Caret offset before insert: {before}, after insert: {after}, total length: {total}");

            userActions.LogConsoleMessage("Verify : the inserted character advanced the caret by exactly one (caret stayed mid-text)");
            Assert.That(after, Is.EqualTo(before + 1),
                "Editing a step moved the caret: after inserting one character the caret should sit immediately after it " +
                $"(expected offset {before + 1}) but was at {after} - a jump to start/end means the field re-rendered and reset the caret.");

            userActions.LogConsoleMessage("Verify : the caret did NOT jump to the end of the field");
            Assert.That(after, Is.LessThan(total),
                $"The caret jumped to the end of the step text (offset {after} of {total}) instead of staying where the user typed.");
        }

        // Self-contained (does not depend on TC30 or any run order): creates its own
        // 'RemoveAddSaveTestCase' with an initial step, then removes that step, adds a fresh step with
        // dummy text, saves it, and verifies the new step persisted. Any leftover from a prior run is
        // purged at the start (idempotent).
        [Test]
        public void TC31RemoveAddSave()
        {
            userActions.LogConsoleMessage(TestContext.CurrentContext.Test.MethodName!);

            const string InitialAction = "Initial step to be removed";
            const string DummyAction = "Dummy step action text";
            const string DummyExpectation = "Dummy expectation text";

            userActions.LogConsoleMessage("Set Up : ");
            userActions.LogConsoleMessage("Remove any leftover 'RemoveAddSaveTestCase' from a prior run (idempotent start)");
            PurgeTestCasesByName("RemoveAddSaveTestCase");
            Actor.AttemptsTo(CreatTestCase.For("RemoveAddSaveTestCase", "Testcase for remove/add/save step"));

            Actions actions = new Actions(driver);
            SelectTestCase("RemoveAddSaveTestCase");

            // Arrange : add an initial step so there is a step to remove.
            userActions.LogConsoleMessage("Arrange : add an initial step so there is one to remove");
            Actor.WaitsUntil(Appearance.Of(TestCases.AddStepButton), IsEqualTo.True());
            Actor.AttemptsTo(Hover.Over(TestCases.AddStepButton));
            Actor.AttemptsTo(Click.On(TestCases.AddStepButton));

            actions.SendKeys(Keys.PageDown).Pause(TimeSpan.FromSeconds(1)).Build().Perform();
            //Steps (action)
            Actor.AttemptsTo(WriteToIframe.For(driver, 2, InitialAction));
            //Expectations
            Actor.AttemptsTo(WriteToIframe.For(driver, 3, "Initial expectation"));

            Actor.WaitsUntil(Appearance.Of(TestCases.SaveStep1), IsEqualTo.True(), timeout: 45);
            Actor.AttemptsTo(Hover.Over(TestCases.SaveStep1));
            Actor.AttemptsTo(Click.On(TestCases.SaveStep1));

            // Wait for the initial step to finish saving (renders in display mode) before removing it.
            IWebLocator initialStepText = new WebLocator("InitialStepText", By.XPath($"//p[normalize-space()='{InitialAction}']"));
            Actor.WaitsUntil(Appearance.Of(initialStepText), IsEqualTo.True(), timeout: 45);

            userActions.LogConsoleMessage("Action steps : remove the existing step");
            RemoveStep();

            // Wait for the removed step's display to disappear before adding a new one, so the new step
            // renders at steps-0 (a stale steps-0-display would shift the WriteToIframe editor indices).
            IWebLocator step0Display = new WebLocator("Step0Display", By.XPath("//div[@id='steps-0-display']"));
            Actor.WaitsUntil(Count.Of(step0Display), IsEqualTo.Value(0), timeout: 45);

            userActions.LogConsoleMessage("Add a new step with dummy text");
            Actor.WaitsUntil(Appearance.Of(TestCases.AddStepButton), IsEqualTo.True());
            Actor.AttemptsTo(Hover.Over(TestCases.AddStepButton));
            Actor.AttemptsTo(Click.On(TestCases.AddStepButton));

            actions.SendKeys(Keys.PageDown).Pause(TimeSpan.FromSeconds(1)).Build().Perform();
            //Steps (action)
            Actor.AttemptsTo(WriteToIframe.For(driver, 2, DummyAction));
            //Expectations
            Actor.AttemptsTo(WriteToIframe.For(driver, 3, DummyExpectation));

            userActions.LogConsoleMessage("Save the step");
            Actor.WaitsUntil(Appearance.Of(TestCases.SaveStep1), IsEqualTo.True(), timeout: 45);
            Actor.AttemptsTo(Hover.Over(TestCases.SaveStep1));
            Actor.AttemptsTo(Click.On(TestCases.SaveStep1));

            userActions.LogConsoleMessage("Verify : the new step is saved with the dummy text");
            IWebLocator dummyStepText = new WebLocator("DummyStepText", By.XPath($"//p[normalize-space()='{DummyAction}']"));
            Actor.WaitsUntil(Appearance.Of(dummyStepText), IsEqualTo.True(), timeout: 45);
            userActions.LogConsoleMessage("Verified: step removed, re-added with dummy text, and saved");
        }

        // Drives the OPEN step-edit action editor directly through TinyMCE's own API: sets a known
        // string, places the caret in the MIDDLE of it, inserts a single character (a simulated
        // keystroke), fires the editor's input/change events (the same events the app's React
        // onEditorChange listens to), and reports where the caret ends up. The editor is located the
        // same proven way WriteToIframe does - from the edit form's iframe id -> tinymce.get(...) -
        // rather than by scanning getContent, because a TinyMCE editor that inits inside a display:none
        // form returns empty content until it is shown. Retries a few times while TinyMCE settles after
        // the Edit toggle. Returns a dictionary with:
        //   found   - the step-edit action editor was located and ready
        //   hasText - it contained editable text to place a caret in
        //   before  - absolute caret offset before the insert (mid-text)
        //   after   - absolute caret offset after inserting one character
        //   total   - total character length of the field after the insert
        private Dictionary<string, object> RunEditStepCaretCheck(string knownContent)
        {
            const string script = @"
var text = arguments[0];
var iframe = document.querySelector('#steps-0-form iframe[title=""Rich Text Area""]');
if (!iframe || !iframe.id) return { found: false };
var edId = (iframe.id.slice(-4) === '_ifr') ? iframe.id.slice(0, -4) : iframe.id;
var ed = window.tinymce ? window.tinymce.get(edId) : null;
if (!ed || ed.initialized === false) return { found: false };
ed.setContent('<p>' + text + '</p>');
ed.focus();
var doc = ed.getDoc();
var walker = doc.createTreeWalker(ed.getBody(), NodeFilter.SHOW_TEXT, null, false);
var node = null, n;
while (n = walker.nextNode()) { if (n.textContent && n.textContent.replace(/ /g,' ').trim().length > 0) { node = n; break; } }
if (!node) return { found: true, hasText: false };
var mid = Math.floor(node.textContent.length / 2);
var rng = ed.dom.createRng();
rng.setStart(node, mid); rng.setEnd(node, mid);
ed.selection.setRng(rng);
function absOffset() {
    var r = ed.selection.getRng();
    var pre = ed.dom.createRng();
    pre.selectNodeContents(ed.getBody());
    pre.setEnd(r.startContainer, r.startOffset);
    return pre.toString().length;
}
var before = absOffset();
ed.insertContent('X');
ed.fire('input'); ed.fire('change');
var after = absOffset();
var total = (ed.getContent({format:'text'}) || '').length;
return { found: true, hasText: true, before: before, after: after, total: total };
";
            for (int attempt = 0; attempt < 10; attempt++)
            {
                var result = (Dictionary<string, object>)((IJavaScriptExecutor)driver)
                    .ExecuteScript(script, knownContent);
                if (result != null && result.TryGetValue("found", out var found) && Convert.ToBoolean(found))
                    return result;
                new Actions(driver).Pause(TimeSpan.FromSeconds(1)).Build().Perform();
            }
            throw new NoSuchElementException("The step-edit action TinyMCE editor (#steps-0-form) was not ready after the Edit click");
        }

        // Open the Projects dropdown reliably. The "Projects" link is a dropdown toggle, and a single
        // click is occasionally swallowed when the header is still re-rendering right after a
        // save/lock/navigation - so the menu never opens and the "All" item never appears (the flaky
        // "'All Link' ... timed out" failure, e.g. TC27 right after locking a test case). Retry the
        // toggle until "All" is actually visible. Mirrors AttributeTests.SwitchToDokimionLS.
        private void OpenProjectsDropdown()
        {
            Actor.WaitsUntil(Appearance.Of(Header.ProjectsLink), IsEqualTo.True(), timeout: 30);
            for (int attempt = 0; attempt < 4; attempt++)
            {
                ClickWithRetry(Header.ProjectsLink);
                new Actions(driver).Pause(TimeSpan.FromSeconds(1)).Build().Perform();
                if (Actor.AskingFor(Appearance.Of(Header.AllLink))) break;
            }
            Actor.WaitsUntil(Appearance.Of(Header.AllLink), IsEqualTo.True(), timeout: 30);
        }

        // Navigate from the current project to paratext2 and open its TestCases page. Mirrors
        // OpenProjectLSTestCases but targets the paratext2 project card.
        private void OpenParatext2TestCases()
        {
            OpenProjectsDropdown();
            ClickWithRetry(Header.AllLink);
            Actor.WaitsUntil(Appearance.Of(Header.Paratext2Project), IsEqualTo.True(), timeout: 30);
            ClickWithRetry(Header.Paratext2Project);
            Actor.WaitsUntil(Appearance.Of(Header.TestCases), IsEqualTo.True(), timeout: 30);
            ClickWithRetry(Header.TestCases);
            Actor.WaitsUntil(TextList.For(TestCases.GetTestCaseNameList), IsAnEnumerable<string>.WhereTheCount(IsGreaterThanOrEqualTo.Value(1)), timeout: 60);
        }

        // Number of test-case rows currently rendered in the tree (each row has one data-role='display' span).
        private int CountDisplayedTestCases()
            => TestCases.GetTestCaseNameList.FindElements(driver).Count;

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
            LoginWithRetry("LoginAsNonAdmin", () =>
            {
                EnsureCleanLoginPage();
                Actor.AttemptsTo(LoginUser.For(username, password));
                Actor.WaitsUntil(Appearance.Of(Header.DokimionLaunchStatisticsProject), IsEqualTo.True(), timeout: 30);
            });
        }

        // Click, retrying on the transient "Node ... does not belong to the document" / stale-element
        // error that occurs when a React/gijgo re-render detaches the node between find and click. Boa
        // retries StaleElementReferenceException but not this -32000 WebDriverException, so we retry here.
        private void ClickWithRetry(IWebLocator locator, int attempts = 4)
        {
            for (int i = 0; ; i++)
            {
                try { Actor.AttemptsTo(Click.On(locator)); return; }
                catch (WebDriverException) when (i < attempts - 1)
                {
                    new Actions(driver).Pause(TimeSpan.FromMilliseconds(500)).Build().Perform();
                }
            }
        }

        // ----- helpers for TC23 / TC24 -----

        // Navigate from the current project to Dokimion_LS and open its TestCases page.
        private void OpenProjectLSTestCases()
        {
            // Open the Projects dropdown with the retry-until-"All"-appears helper: this often runs right
            // after a prior test's save/lock/session-restore, when the header is still re-rendering, so a
            // single toggle click is swallowed and the "All" item never appears.
            OpenProjectsDropdown();
            ClickWithRetry(Header.AllLink);
            Actor.WaitsUntil(Appearance.Of(Header.DokimionLaunchStatisticsProject), IsEqualTo.True(), timeout: 30);
            ClickWithRetry(Header.DokimionLaunchStatisticsProject);
            Actor.WaitsUntil(Appearance.Of(Header.TestCases), IsEqualTo.True(), timeout: 30);
            ClickWithRetry(Header.TestCases);
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
            // Use EnsureCleanLoginPage (logout + cookie-clear + reload with 429-aware retry) and retry
            // the whole login, same as RestoreAdminSession/LoginAsNonAdmin: under a full-suite run the
            // login form can render and then be replaced by an nginx 429 error, timing out the login.
            LoginWithRetry("SwitchToNormalUser", () =>
            {
                EnsureCleanLoginPage();
                Actor.AttemptsTo(LoginUser.For(userActions.NormalTester!, userActions.NormalTesterPasswd!));
                Actor.WaitsUntil(Appearance.Of(Header.DokimionLaunchStatisticsProject), IsEqualTo.True(), timeout: 30);
            });
        }

        // Restore the admin session used by the rest of the class.
        // Log out and reach a clean, retpath-free login page. The SPA's page loads can hit nginx's 429
        // rate limit (many API calls per load), so retry the reload with backoff. Logout + cookie-clear
        // together end the session; reloading the app ROOT (not a protected page) keeps the login
        // retpath-free, so the subsequent login lands on the projects list (mirroring OneTimeSetUp).
        private void EnsureCleanLoginPage()
        {
            try { Actor.AttemptsTo(Logout.For()); } catch { /* may already be logged out / no user menu */ }
            driver.Manage().Cookies.DeleteAllCookies();
            for (int attempt = 1; attempt <= 4; attempt++)
            {
                driver.Navigate().GoToUrl(userActions.DokimionUrl!);
                try
                {
                    Actor.WaitsUntil(Appearance.Of(LoginPage.NameInput), IsEqualTo.True(), timeout: 15);
                    return;
                }
                catch
                {
                    userActions.LogConsoleMessage(
                        $"EnsureCleanLoginPage: login page not shown (attempt {attempt}/4); backing off ~10s (likely a 429 page load)");
                    System.Threading.Thread.Sleep(10000);
                }
            }
            // Last try surfaces the real error if the page still won't load.
            driver.Navigate().GoToUrl(userActions.DokimionUrl!);
            Actor.WaitsUntil(Appearance.Of(LoginPage.NameInput), IsEqualTo.True(), timeout: 30);
        }

        // Restore a clean admin session that lands on the projects list (where DokimionProject lives).
        // Retries the whole login on failure (same 429-throttled-login-page reason as LoginAsNonAdmin):
        // a single-shot restore was the TC26/27/28 cascade - once the admin session is not restored,
        // every following test that needs it fails too.
        private void RestoreAdminSession()
        {
            LoginWithRetry("RestoreAdminSession", () =>
            {
                EnsureCleanLoginPage();
                Actor.AttemptsTo(LoginUser.For(userActions.AdminUser!, userActions.AdminPass!));
                Actor.WaitsUntil(Appearance.Of(Header.DokimionProject), IsEqualTo.True(), timeout: 30);
                Actor.AttemptsTo(Click.On(Header.DokimionProject));
            });
        }

        // Run a full login sequence, retrying the WHOLE thing (not just LoginUser's submit) on any
        // failure. Under a full-suite run nginx's 429 rate limit can render the login form and then
        // replace it with an error a moment later, so the login page appears (EnsureCleanLoginPage
        // returns) but the follow-up NameInput / landing wait times out. On failure, back off and let
        // the sequence reload a fresh login page before retrying. Shared by the three login helpers.
        private void LoginWithRetry(string label, Action loginSequence)
        {
            for (int attempt = 1; ; attempt++)
            {
                try { loginSequence(); return; }
                catch (Exception ex) when (attempt < 3)
                {
                    userActions.LogConsoleMessage(
                        $"{label} attempt {attempt}/3 failed (likely a 429-throttled login page); backing off 15s and retrying: {ex.Message}");
                    System.Threading.Thread.Sleep(15000);
                }
            }
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
    
        // FadeLoader inside .sweet-loading renders only while the tree is loading (see TestCases.js).
        private static readonly IWebLocator TreeLoadingSpinner = new WebLocator("TestCaseTreeLoading",
            By.XPath("//div[contains(@class,'sweet-loading')]//span"));

        // Scope the current project's test-case tree to a single name using the fulltext Search box,
        // then wait for the (small) filtered result to settle. The tree renders only the first
        // TC_FETCH_LIMIT (50) test cases without a filter (see TestCases.js), so a freshly created test
        // case in a project that already has 50+ falls off the first page and cannot be found by
        // scanning the displayed nodes. Filtering by name guarantees it is rendered regardless of how
        // many test cases the project has. Same mechanism TC28 exercises.
        private void FilterTreeByName(string name)
        {
            Actor.AttemptsTo(Click.On(Header.TestCases));
            Actor.WaitsUntil(Appearance.Of(TestCases.SearchInput), IsEqualTo.True(), timeout: 30);
            Actor.AttemptsTo(Clear.On(TestCases.SearchInput));
            Actor.AttemptsTo(SendKeys.To(TestCases.SearchInput, name));
            Actor.AttemptsTo(Hover.Over(TestCases.FilterLocator));
            Actor.AttemptsTo(Click.On(TestCases.FilterLocator));

            Actor.WaitsUntil(Appearance.Of(TreeLoadingSpinner), IsEqualTo.False(), timeout: 60);
            new Actions(driver).Pause(TimeSpan.FromSeconds(1)).Build().Perform();
        }

        // Idempotent setup: delete ALL pre-existing test cases whose name contains the given text
        // (leftovers from an aborted prior run). TC08-TC10 create same-named test cases and
        // SelectTestCase picks the LAST match, so a leftover that already has a step shifts the
        // WriteToIframe indices and hides SaveStep1 (the 45s timeout documented on TC08). Purging
        // first guarantees only the fresh test case exists. Runs in the current project's TestCases.
        // Filters by the name via Search each pass so matches are found even when the project has more
        // than TC_FETCH_LIMIT (50) test cases - the unfiltered tree only shows the first 50, so a
        // beyond-page leftover would be silently missed and duplicates would accumulate every run.
        private void PurgeTestCasesByName(string testcaseName)
        {
            for (int attempt = 0; attempt < 30; attempt++)
            {
                FilterTreeByName(testcaseName);

                IWebElement? match;
                try
                {
                    match = TestCases.GetTestCaseNameList.FindElements(driver)
                        .FirstOrDefault(e => e.Text.Contains(testcaseName));
                }
                catch (StaleElementReferenceException) { continue; }

                if (match == null) break; // none left

                try
                {
                    new Actions(driver).MoveToElement(match).Click().Build().Perform();
                    Actor.AttemptsTo(DeleteTestCase.For(driver));
                }
                catch (Exception ex)
                {
                    // The delete (Remove + confirm) may have succeeded even if the post-delete reload
                    // wait threw a transient stale-node error; the next pass re-filters and re-checks.
                    userActions.LogConsoleMessage("Purge delete hit a transient error (will re-check): " + ex.Message);
                }
            }
            // No explicit filter reset needed: the next CreatTestCase / test navigates to
            // "/{project}/testcases" (no query), which clears the fulltext filter (see Header.js).
        }

        // Select a test case in the tree and return its name text. First scans the currently displayed
        // tree (the fast, common case); if the target is not on the first page (the tree caps at
        // TC_FETCH_LIMIT=50), it scopes the tree to the name via the Search filter and retries, so
        // selection works regardless of the project's size. Re-queries on stale re-renders, then moves
        // to the node (scrolling it into view, like a user) and clicks it.
        private string SelectTestCase(string testcasename)
        {
            Actor.WaitsUntil(TextList.For(TestCases.GetTestCaseNameList), IsAnEnumerable<string>.WhereTheCount(IsGreaterThanOrEqualTo.Value(1)), timeout: 60);

            // Fast path: it is usually already visible on the current page.
            string? selected = TrySelectFromTree(testcasename, attempts: 5);
            if (selected != null) return selected;

            // Fallback: not on the first page - filter the tree by name so it is rendered, then select.
            userActions.LogConsoleMessage("Test case not on the first page; filtering the tree by name via Search: " + testcasename);
            FilterTreeByName(testcasename);
            selected = TrySelectFromTree(testcasename, attempts: 60);
            if (selected != null) return selected;

            throw new NoSuchElementException("Test case not found in tree: " + testcasename);
        }

        // Look for the named test case among the currently displayed tree nodes for up to `attempts`
        // one-second passes; click and return its text if found, otherwise return null. Picks the LAST
        // match (matching the original SelectTestCase behaviour).
        private string? TrySelectFromTree(string testcasename, int attempts)
        {
            for (int attempt = 0; attempt < attempts; attempt++)
            {
                try
                {
                    IWebElement? match = TestCases.GetTestCaseNameList.FindElements(driver)
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
            return null;
        }


    }
}
