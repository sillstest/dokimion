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
        public void TC25DeleteTestCase()
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
