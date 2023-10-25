using Boa.Constrictor.Screenplay;
using Boa.Constrictor.Selenium;
using Dokimion.Interactions;
using Dokimion.Pages;
using OpenQA.Selenium;
using OpenQA.Selenium.Chrome;
using OpenQA.Selenium.Interactions;
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
            userActions.LogConsoleMessage("Login as User");
            Actor.AttemptsTo(LoginUser.For(userActions.Username!, userActions.Password!));
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
            //try
            //{
            userActions.LogConsoleMessage("Action steps : ");

            userActions.LogConsoleMessage("Click on the Testcases on header");
            Actor.AttemptsTo(Click.On(Header.TestCases));

            userActions.LogConsoleMessage("Click on the '+' to Add Test cases");
            Actor.AttemptsTo(Click.On(TestCases.AddTestCase));

            userActions.LogConsoleMessage("Enter the Test Case Name");
            Actor.WaitsUntil(Appearance.Of(TestCases.TestCaseName), IsEqualTo.True());
            Actor.AttemptsTo(Clear.On(TestCases.TestCaseName));
            Actor.AttemptsTo(SendKeys.To(TestCases.TestCaseName, "Validate login"));

            userActions.LogConsoleMessage("Enter the Test Case Description");
            Actor.AttemptsTo(SendKeys.To(TestCases.TestCaseDescription, "Test that validates login"));

            userActions.LogConsoleMessage("Submit the Save Changes button");
            Actor.AttemptsTo(Click.On(TestCases.SaveTestCaseButton));

            var testCaseName = Actor.AsksFor(Text.Of(TestCases.GetTestCaseName));

            userActions.LogConsoleMessage("Verify : Testcase is created");
            Assert.That(testCaseName.Substring(0, 14), Is.EqualTo("Validate login"));

            //scrolls the page down
            Actions actions = new Actions(driver);
            actions.SendKeys(Keys.PageDown).Pause(TimeSpan.FromSeconds(1)).Build().Perform();
            actions.Release().Build().Perform();

            userActions.LogConsoleMessage("Clean up:");
            userActions.LogConsoleMessage("Click on the Remove Testcase button");
            Actor.AttemptsTo(Click.On(TestCases.RemoveTestCase));

            userActions.LogConsoleMessage("Click on the Remove Testcase button on confirmation box");

            actions.Pause(TimeSpan.FromSeconds(1)).Build().Perform();
            actions.MoveToElement(TestCases.RemoveTestCaseButton.FindElement(driver))
            .Click(TestCases.RemoveTestCaseButton.FindElement(driver)).Build().Perform();

            actions.Pause(TimeSpan.FromSeconds(1)).Build().Perform();
            //}
            //catch (Exception e)
            //{
            //    userActions.LogConsoleMessage(e.ToString());
            //    userActions.captureScreenShot(driver, "TC7CreateTestCase");
            //}
        }

        [Test]
        public void TC08Add2StepsToTestCase()
        {
            userActions.LogConsoleMessage(TestContext.CurrentContext.Test.MethodName!);
            userActions.LogConsoleMessage("Set Up : ");
            Actor.AttemptsTo(CreatTestCase.For("Add2StepsToTestCase", "Testcase for adding 2 Steps"));

            //try
            //{
            userActions.LogConsoleMessage("Action steps : ");

            userActions.LogConsoleMessage("Click on the Validate login TestcaseName");
            Actor.AttemptsTo(Click.On(TestCases.GetTestCaseName));

            userActions.LogConsoleMessage("Click on the Add Steps Button to input step 1");
            Actor.WaitsUntil(Appearance.Of(TestCases.AddStepButton), IsEqualTo.True());

            Actions actions = new Actions(driver);
            IWebElement element = TestCases.AddStepButton.FindElement(driver);
            actions.MoveToElement(element);
            actions.Click(element);
            actions.Pause(TimeSpan.FromSeconds(1)).Build().Perform();

            //Steps
            Actor.AttemptsTo(WriteToIframe.For(driver, 2, "Go to Quack home page"));
            //Expectations
            Actor.AttemptsTo(WriteToIframe.For(driver, 3, "Quack login page opens"));
            //dynamic element need to wait

            userActions.LogConsoleMessage("Click on the Save Button to input step 1");
            Actor.WaitsUntil(Appearance.Of(TestCases.SaveStep1), IsEqualTo.True());
            Actor.AttemptsTo(Click.On(TestCases.SaveStep1));

            //Add 2nd step
            userActions.LogConsoleMessage("Click on the Add Steps Button to input step 2");
            Actor.WaitsUntil(Appearance.Of(TestCases.AddStepButton), IsEqualTo.True());

            //We need to scroll to add another step
            actions = new Actions(driver);
            IWebElement element1 = TestCases.AddStepButton.FindElement(driver);
            actions.MoveToElement(element1);
            actions.Click(element1);
            actions.Pause(TimeSpan.FromSeconds(1)).Build().Perform();

            //Step 2
            Actor.AttemptsTo(WriteToIframe.For(driver, 4, "Login as admin"));
            //Expectations 2
            Actor.AttemptsTo(WriteToIframe.For(driver, 5, "List of projects opens"));

            //Scroll down page
            actions.SendKeys(Keys.PageDown).Pause(TimeSpan.FromSeconds(1)).Build().Perform();

            var saveAppreared = Actor.AskingFor(Appearance.Of(TestCases.SaveStep2));

            userActions.LogConsoleMessage("Click on the Save Button to input step 1");
            Actor.WaitsUntil(Appearance.Of(TestCases.SaveStep2), IsEqualTo.True());
            Actor.AttemptsTo(Click.On(TestCases.SaveStep2));
            // Verify
            userActions.LogConsoleMessage("Verify : Step 1 conatins Go to Quack home page");
            string step1Text = Actor.AskingFor(Text.Of(TestCases.Step1Text));
            Assert.That(step1Text, Is.EqualTo("Go to Quack home page"));

            userActions.LogConsoleMessage("Step 2 conatins Login as admin");
            string step2Text = Actor.AskingFor(Text.Of(TestCases.Step2Text));
            Assert.That(step2Text, Is.EqualTo("Login as admin"));

            userActions.LogConsoleMessage("Clean up :");
            userActions.LogConsoleMessage("Removed 2nd step");
            removeStep();
            removeStep();
            userActions.LogConsoleMessage("Remove TestCase");
            removeTestCase();
            //}
            //catch (Exception ex)
            //{
            //    userActions.LogConsoleMessage(ex.ToString());
            //    // userActions.captureScreenShot(driver, "TC8AddStepsToTestCase");

            //}

        }

        [Test]
        public void TC09UpdateExpectation2()
        {
            userActions.LogConsoleMessage(TestContext.CurrentContext.Test.MethodName!);
            userActions.LogConsoleMessage("Set Up : ");
            Actor.AttemptsTo(CreatTestCase.For("UpdateExpectation2", "Testcase for adding 2 Steps and update"));

            //try
            //{
            userActions.LogConsoleMessage("Action steps : ");

            userActions.LogConsoleMessage("Click on the Validate login TestcaseName");
            Actor.AttemptsTo(Click.On(TestCases.GetTestCaseName));

            userActions.LogConsoleMessage("Click on the Add Steps Button to input step 1");
            Actor.WaitsUntil(Appearance.Of(TestCases.AddStepButton), IsEqualTo.True());

            Actions actions = new Actions(driver);
            IWebElement element = TestCases.AddStepButton.FindElement(driver);
            actions.MoveToElement(element);
            actions.Click(element);
            actions.Pause(TimeSpan.FromSeconds(1)).Build().Perform();

            //Steps
            Actor.AttemptsTo(WriteToIframe.For(driver, 2, "Go to Quack home page"));
            //Expectations
            Actor.AttemptsTo(WriteToIframe.For(driver, 3, "Quack login page opens"));
            //dynamic element need to wait

            userActions.LogConsoleMessage("Click on the Save Button");
            Actor.WaitsUntil(Appearance.Of(TestCases.SaveStep1), IsEqualTo.True());
            Actor.AttemptsTo(Click.On(TestCases.SaveStep1));

            //Add 2nd step
            userActions.LogConsoleMessage("Click on the Add Steps Button to input step 2");
            Actor.WaitsUntil(Appearance.Of(TestCases.AddStepButton), IsEqualTo.True());

            //We need to scroll to add another step
            actions = new Actions(driver);
            IWebElement element1 = TestCases.AddStepButton.FindElement(driver);
            actions.MoveToElement(element1);
            actions.Click(element1);
            actions.Pause(TimeSpan.FromSeconds(1)).Build().Perform();

            //Step 2
            Actor.AttemptsTo(WriteToIframe.For(driver, 4, "Login as admin"));
            //Expectations 2
            Actor.AttemptsTo(WriteToIframe.For(driver, 5, "List of projects opens"));

            //Scroll down page
            actions.SendKeys(Keys.PageDown).Pause(TimeSpan.FromSeconds(1)).Build().Perform();

            var saveAppreared = Actor.AskingFor(Appearance.Of(TestCases.SaveStep2));

            userActions.LogConsoleMessage("Click on the Save button");
            Actor.WaitsUntil(Appearance.Of(TestCases.SaveStep2), IsEqualTo.True());
            Actor.AttemptsTo(Click.On(TestCases.SaveStep2));

            //Edit ..
            userActions.LogConsoleMessage("Click on the Edit Link");
            Actor.AttemptsTo(Click.On(TestCases.EditStep2Expectations));

            actions.Pause(TimeSpan.FromSeconds(1)).Build().Perform();

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
            Assert.That(Expectations2Text, Is.EqualTo("List of projects opens UPD"));
            driver.SwitchTo().DefaultContent();

            // Cleanup
            userActions.LogConsoleMessage("Clean up :");
            userActions.LogConsoleMessage("Remove 2 steps");
            removeStep();
            removeStep();
            userActions.LogConsoleMessage("Remove TestCase");
            removeTestCase();
            //}
            //catch (Exception ex)
            //{
            //    userActions.LogConsoleMessage(ex.StackTrace!);

            //    // userActions.captureScreenShot(driver, "TC8AddStepsToTestCase");

            //}
        }



        [Test]
        public void TC10AddPreconditionTestCase()
        {
            userActions.LogConsoleMessage(TestContext.CurrentContext.Test.MethodName!);
            userActions.LogConsoleMessage("Set Up : ");
            userActions.LogConsoleMessage("Create a Testcase");
            Actor.AttemptsTo(CreatTestCase.For("PreconditionTestCase", "Testcase for adding precondition"));


            //try
            //{
            userActions.LogConsoleMessage("Action steps : ");

            userActions.LogConsoleMessage("Click on the Validate login TestcaseName");
            Actor.AttemptsTo(Click.On(TestCases.GetTestCaseName));

            userActions.LogConsoleMessage("Click on the Preconditions");
            Actor.WaitsUntil(Existence.Of(TestCases.Preconditions), IsEqualTo.True());

            Actions actions = new Actions(driver);
            IWebElement element = TestCases.Preconditions.FindElement(driver);
            actions.MoveToElement(element);
            actions.Click(element);
            actions.Pause(TimeSpan.FromSeconds(1)).Build().Perform();

            //Preconditions frame index
            Actor.AttemptsTo(WriteToIframe.For(driver, 1, "Quack has to be installed and available"));

            // scroll
            actions.SendKeys(Keys.PageDown).Pause(TimeSpan.FromSeconds(1)).Build().Perform();


            userActions.LogConsoleMessage("Click on Save button");
            Actor.WaitsUntil(Appearance.Of(TestCases.SavePreconditions), IsEqualTo.True());
            Actor.AttemptsTo(Click.On(TestCases.SavePreconditions));

            // Verify
            userActions.LogConsoleMessage("Verify : Precondition text contains Quack has to be installed and available");
            string preconditionText = Actor.AskingFor(Text.Of(TestCases.PreconditionsText));
            Assert.That(preconditionText
                , Is.EqualTo("Quack has to be installed and available"));


            userActions.LogConsoleMessage("Clean up : Delete Testcase");
            removeTestCase();

            //}
            //catch (Exception ex)
            //{
            //    userActions.LogConsoleMessage(ex.ToString());

            //    // userActions.captureScreenShot(driver, "TC8AddStepsToTestCase");
            //}

        }

        private void removeStep()
        {
            // userActions.LogConsoleMessage("Before clicking on Remove");
            Actions actions = new Actions(driver);
            actions.Pause(TimeSpan.FromSeconds(1)).Build().Perform();
            Actor.WaitsUntil(Appearance.Of(TestCases.RemoveStep1), IsEqualTo.True(), timeout: 45);
            Actor.AttemptsTo(Click.On(TestCases.RemoveStep1));

            //Confirm pop up is displayed
            Actor.WaitsUntil(Appearance.Of(TestCases.RemoveStep1Confirm), IsEqualTo.True());
            Actor.WaitsUntil(Appearance.Of(TestCases.FinalRemoveStep1), IsEqualTo.True());

            actions.MoveToElement(TestCases.FinalRemoveStep1.FindElement(driver))
                .Click(TestCases.FinalRemoveStep1.FindElement(driver)).Build().Perform();
            actions.Pause(TimeSpan.FromSeconds(1)).Build().Perform();

        }

        private void removeTestCase()
        {
            userActions.LogConsoleMessage("Click on the Remove Testcase button");
            Actor.AttemptsTo(Click.On(TestCases.RemoveTestCase));

            userActions.LogConsoleMessage("Click on the Remove Testcase button on confirmation box");

            Actions actions = new Actions(driver);

            bool isVisible = Actor.AskingFor(Appearance.Of(TestCases.RemoveTestCaseButton));
            if (!isVisible)
            {
                //scoll to the bottom
                actions.SendKeys(Keys.PageDown).Pause(TimeSpan.FromSeconds(1)).Build().Perform();

            }

            actions.Pause(TimeSpan.FromSeconds(1)).Build().Perform();
            actions.MoveToElement(TestCases.RemoveTestCaseButton.FindElement(driver))
            .Click(TestCases.RemoveTestCaseButton.FindElement(driver)).Pause(TimeSpan.FromSeconds(1)).Build().Perform();
        }
    }
}
