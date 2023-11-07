using Boa.Constrictor.Screenplay;
using Boa.Constrictor.Selenium;
using Dokimion.Interactions;
using Dokimion.Pages;
using OpenQA.Selenium;
using OpenQA.Selenium.Chrome;
using OpenQA.Selenium.Interactions;
using System.Collections.ObjectModel;
using WebDriverManager;
using WebDriverManager.DriverConfigs.Impl;
using WebDriverManager.Helpers;

namespace Dokimion.Tests
{
    internal class LaunchSuiteCreationTests
    {

        private IActor Actor;
        UserActions userActions;
        ChromeDriver driver;
        CreationAndFilterHelpers creationAndFilterHelpers;

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
                // Actor.AttemptsTo(Navigate.ToUrl("http://192.168.56.103"));// userActions.DokimionUrl));
                Actor.AttemptsTo(Navigate.ToUrl( userActions.DokimionUrl));
                //Page is redirected after initial URL
                Actor.AttemptsTo(Wait.Until(Appearance.Of(LoginPage.NameInput), IsEqualTo.True()));
            }
            catch (Exception ex)
            {
                userActions.captureScreenShot(driver, "LoginPageTest");

                count++;
                Actor.AttemptsTo(Wait.Until(Appearance.Of(LoginPage.NameInput), IsEqualTo.True()).ForAnAdditional(3));
                userActions.LogConsoleMessage("Unable to load page : retried with addtionatime on " + count + " " + ex.ToString());

            }

            Actor.WaitsUntil(Appearance.Of(LoginPage.LoginPageWelcomeMsg), IsEqualTo.True());
            var welcomeMessage = Actor.AskingFor(Text.Of(LoginPage.LoginPageWelcomeMsg));
            userActions.LogConsoleMessage("Login Page is loaded successfully on count " + count + " " + welcomeMessage);

            userActions.LogConsoleMessage("Set Up : ");
            userActions.LogConsoleMessage("Login as User");
            Actor.AttemptsTo(LoginUser.For(userActions.Username!, userActions.Password!));
            Actor.WaitsUntil(Appearance.Of(Header.DokimionLaunchStatisticsProject), IsEqualTo.True(), timeout: 15);
            Actor.AttemptsTo(Click.On(Header.DokimionLaunchStatisticsProject));
            creationAndFilterHelpers = new CreationAndFilterHelpers();
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
        public void TC16GroupingAndFiltersValidation()
        {
            //Once the Testcase tree is build we can filter
            userActions.LogConsoleMessage(TestContext.CurrentContext.Test.MethodName!);
            userActions.LogConsoleMessage("Set Up : ");

            userActions.LogConsoleMessage("Action steps : ");
            userActions.LogConsoleMessage("Click on the Testcases on header");
            Actor.AttemptsTo(Click.On(Header.TestCases));

            userActions.LogConsoleMessage("Click on the Grouping Select Input");
            Actor.AttemptsTo(Click.On(TestCases.GroupingSelect));
            //From the drop down 
            userActions.LogConsoleMessage("Select from dropdown: Functionality, Priority and Placement ");
            userActions.LogConsoleMessage("Click on Functionality, Priority, Placement ");

            Actions actions = new Actions(driver);
            //for now loop 3 times - no of attributes
            for (int j = 0; j < 3; j++)
            {

                ReadOnlyCollection<IWebElement> listOfAttributes = TestCases.GroupingDropDown.FindElements(driver);
                List<IWebElement> list = listOfAttributes.ToList();
                int count = list.Count;

                if (list != null && count > 0)
                {
                    IWebElement element = list.ElementAt(0);
                    element.Click();

                }
                if (count > 1)
                {
                    //Need to click on select for the dropdown
                    Actor.AttemptsTo(Click.On(TestCases.GroupAfterFirstSelect));
                }
            }

            userActions.LogConsoleMessage("Click on the Filter button");

            Actor.AttemptsTo(Click.On(TestCases.FilterLocator));
            Actor.WaitsUntil(TextList.For(TestCases.TestCaseTreeListMain), IsAnEnumerable<string>.WhereTheCount(IsEqualTo.Value(6)), timeout: 60);
            ReadOnlyCollection<IWebElement> Tc = TestCases.TestCaseTreeListMain.FindElements(driver);

            userActions.LogConsoleMessage("Verify : There are 6 Testcases in the list");

            //Have to wait as the dom changed
            Assert.That(Tc.Count, Is.EqualTo(6));
            //
            ReadOnlyCollection<IWebElement> Group_Filters = TestCases.GroupingTreeDepthAuth.FindElements(driver);
            Assert.IsNotNull(Group_Filters);
            Assert.That(Group_Filters.Count, Is.EqualTo(3));

            userActions.LogConsoleMessage("Verify : The depth of the tree is 3");
            userActions.LogConsoleMessage("Verify : That 'Authentication' has 'Validate Login' TC present");


            string Authentication = Actor.AskingFor(Text.Of(TestCases.AuthenticationGroupTC));
            Assert.That(Authentication, Is.EqualTo("Authentication"));
            for (int i = 1; i <= Group_Filters.Count; i++)
            {
                string locator = $"(//li[contains(@data-id,'Authentication')]//i[contains(@class,'gj-icon')])[{i}]";
                driver.FindElement(By.XPath(locator)).Click();
                if (i == Group_Filters.Count)
                {
                    string validateLogin = Actor.AskingFor(Text.Of(TestCases.ValidateLoginGroupTC));
                    Assert.That(validateLogin.Contains("Validate login"), Is.True);
                }
            }

            userActions.LogConsoleMessage("Select 'Priority' on the Filter selection");
            Actor.AttemptsTo(Click.On(TestCases.Filter1Locator));
            Actor.AttemptsTo(Click.On(TestCases.Filter1AttributeLocator));

            userActions.LogConsoleMessage("Select 'High' on the Filter selection");

            Actor.AttemptsTo(Click.On(TestCases.Filter1Selector));
            Actor.AttemptsTo(Click.On(TestCases.Filter1AttribValue));

            userActions.LogConsoleMessage("Click on Filter Button");

            Actor.AttemptsTo(Click.On(TestCases.FilterLocator));
            //Verify
            Actor.WaitsUntil(TextList.For(TestCases.TestCaseTreeListMain), IsAnEnumerable<string>.WhereTheCount(IsEqualTo.Value(4)), timeout: 60);

            ReadOnlyCollection<IWebElement> Tc_Priority = TestCases.TestCaseTreeListMain.FindElements(driver);

            userActions.LogConsoleMessage("Verfiy : That the TestCase list is 4 after filter");

            Assert.That(Tc_Priority.Count, Is.EqualTo(4));
            string Authentication_Priority = Actor.AskingFor(Text.Of(TestCases.AuthenticationGroupTC));

            userActions.LogConsoleMessage("Verfiy : That the 'Authentication' is present");
            Assert.That(Authentication_Priority, Is.EqualTo("Authentication"));


            ////24.Filters – add filter placement, header
            userActions.LogConsoleMessage("Select 'Placement' on the Filter selection");
            Actor.AttemptsTo(Click.On(TestCases.Filter2Locator));
            Actor.AttemptsTo(Click.On(TestCases.Filter2AttributeLocator));
            userActions.LogConsoleMessage("Select 'Header' on the Filter selection");

            Actor.AttemptsTo(Click.On(TestCases.Filter2Selector));
            Actor.AttemptsTo(Click.On(TestCases.Filter2AttribValue));

            userActions.LogConsoleMessage("Click on the Filter Button");

            Actor.AttemptsTo(Click.On(TestCases.FilterLocator));
            Actor.WaitsUntil(TextList.For(TestCases.TestCaseTreeListMain), IsAnEnumerable<string>.WhereTheCount(IsEqualTo.Value(1)), timeout: 60);

            //Verify
            ReadOnlyCollection<IWebElement> Tc_Placement = TestCases.TestCaseTreeListMain.FindElements(driver);


            userActions.LogConsoleMessage("Verfiy : That the TestCase list is 1 after filter");

            Assert.That(Tc_Placement.Count, Is.EqualTo(1));

            userActions.LogConsoleMessage("Verfiy : That the depth of the Testcase is 3");
            userActions.LogConsoleMessage("Verfiy : 'Header Project List Validation' is present");

            //Depth of this tree is 3
            for (int i = 1; i <= 3; i++)
            {
                string project_locator = $"(//li[contains(@data-id,'Projects')]//i[contains(@class,'gj-icon')])[{i}]";
                driver.FindElement(By.XPath(project_locator)).Click();
                if (i == 3)
                {
                    string headerProjectList_1 = Actor.AskingFor(Text.Of(TestCases.HeaderProjectListGroupTC));
                    Assert.IsNotNull(headerProjectList_1);
                    Assert.That(headerProjectList_1.Contains("Header project list validation"), Is.True);
                }
            }


            //26.Remove priority and placement filter grouping

            userActions.LogConsoleMessage("Click on 'x' on Placement");
            string remove_placement = $"(//*[local-name()='svg' and @class='css-19bqh2r'])[2]";
            //IWebElement remove_icon = driver.FindElement(By.XPath(remove_placement));
            //actions.MoveToElement(remove_icon).Click(remove_icon).Release().Build().Perform();
            Actor.AttemptsTo(Hover.Over(new WebLocator("remove_placement", By.XPath(remove_placement))));
            Actor.AttemptsTo(Click.On(new WebLocator("remove_placement", By.XPath(remove_placement))));


            userActions.LogConsoleMessage("Click on 'x' on Priority");

            string remove_priority = $"(//*[local-name()='svg' and @class='css-19bqh2r'])[2]";
            //remove_icon = driver.FindElement(By.XPath(remove_priority));
            //actions.MoveToElement(remove_icon).Click(remove_icon).Release().Build().Perform();
            Actor.AttemptsTo(Hover.Over(new WebLocator("remove_priority", By.XPath(remove_priority))));
            Actor.AttemptsTo(Click.On(new WebLocator("remove_priority", By.XPath(remove_priority))));


            userActions.LogConsoleMessage("Click on Filter Button");

            Actor.AttemptsTo(Click.On(TestCases.FilterLocator));
            Actor.WaitsUntil(TextList.For(TestCases.TestCaseTreeListMain), IsAnEnumerable<string>.WhereTheCount(IsEqualTo.Value(1)), timeout: 60);

            // - Verify
            userActions.LogConsoleMessage("Verify : The List of Testcases is 1");

            ReadOnlyCollection<IWebElement> Tc_1Group_2Filter = TestCases.TestCaseTreeListMain.FindElements(driver);
            Assert.That(Tc_1Group_2Filter.Count, Is.EqualTo(1));

            userActions.LogConsoleMessage("Verify : The depth of Testcase is 1");

            //Depth of the tree is 1.
            string locator1 = "//li[contains(@data-id,'Projects')]//i[contains(@class,'gj-icon')]";
            Actor.WaitsUntil(Appearance.Of(new WebLocator("Projects", By.XPath(locator1))), IsEqualTo.True(), timeout: 60);
            Actor.AttemptsTo(Click.On(new WebLocator("Projects", By.XPath(locator1))));

            Actor.WaitsUntil(Appearance.Of(TestCases.HeaderProjectListGroupTC), IsEqualTo.True(), timeout: 60);
            string headerProjectList = Actor.AskingFor(Text.Of(TestCases.HeaderProjectListGroupTC));

            userActions.LogConsoleMessage("Verify : The Header project list validation is present");

            Assert.IsNotNull(headerProjectList);
            Assert.That(headerProjectList.Contains("Header project list validation"), Is.True);
            userActions.LogConsoleMessage("Clean up: ");
            //Reset filters
            //Reset filters on Group and 
            IWebLocator FilterSelectSVG = new WebLocator("FilterSelectSVG", By.XPath("//*[local-name()='svg' and @data-icon='minus-circle']"));
            ReadOnlyCollection<IWebElement> minusSVGS = FilterSelectSVG.FindElements(driver);
            for(int i = 0; i < minusSVGS.Count; i++)
            {
                IWebLocator deleteSVGICON = new WebLocator("deleteSVGICON", By.XPath("(//*[local-name()='svg' and @data-icon='minus-circle'])[1]"));
                Actor.WaitsUntil(Appearance.Of(deleteSVGICON), IsEqualTo.True());
                Actor.AttemptsTo(Click.On(deleteSVGICON));
            }

            //Actor.AttemptsTo(Clear.On(TestCases.GroupingSelect));

            string remove_functionality = $"(//*[local-name()='svg' and @class='css-19bqh2r'])[1]";
            //remove_icon = driver.FindElement(By.XPath(remove_priority));
            //actions.MoveToElement(remove_icon).Click(remove_icon).Release().Build().Perform();
            Actor.AttemptsTo(Hover.Over(new WebLocator("remove_functionality", By.XPath(remove_functionality))));
            Actor.AttemptsTo(Click.On(new WebLocator("remove_functionality", By.XPath(remove_functionality))));
            Actor.AttemptsTo(Click.On(TestCases.FilterLocator));


        }


        [Test]
        public void TC17TestSuitesCreated()
        {
            userActions.LogConsoleMessage(TestContext.CurrentContext.Test.MethodName!);
            userActions.LogConsoleMessage("Set Up : ");

            userActions.LogConsoleMessage("Action steps : ");
            //create a group with Functionality and Priority high
            creationAndFilterHelpers.CreateSmokeTestFilter(Actor, driver);

            userActions.LogConsoleMessage("Click on save button on the right");
            Actor.AttemptsTo(Click.On(TestCases.SaveSuiteLocator));
            userActions.LogConsoleMessage("Enter Smoke Test in the input ");
            Actor.AttemptsTo(Clear.On(TestCases.SuiteNameInput));
            Actor.AttemptsTo(SendKeys.To(TestCases.SuiteNameInput, "Smoke Test"));
            userActions.LogConsoleMessage("Click on save button on the right");
            Actor.AttemptsTo(Click.On(TestCases.SuiteSaveButton));

            Actor.WaitsUntil(Appearance.Of(TestCases.TestSuiteNameOnTC), IsEqualTo.True(), timeout: 45);

            Actions actions = new Actions(driver);

            userActions.LogConsoleMessage("Verify : There are 4 test cases after filter");

            Actor.WaitsUntil(TextList.For(TestCases.TestCaseTreeListMain), IsAnEnumerable<string>.WhereTheCount(IsEqualTo.Value(4)), timeout: 60);

            ReadOnlyCollection<IWebElement> Filtered_TestCase = TestCases.TestCaseTreeListMain.FindElements(driver);

            Assert.That(Filtered_TestCase.Count, Is.EqualTo(4));

            string locator1 = "//li[contains(@data-id,'TestCase')]//i[contains(@class,'gj-icon')]";
            driver.FindElement(By.XPath(locator1)).Click();
            string locator2 = "//li[contains(@data-id,'Launch')]//i[contains(@class,'gj-icon')]";
            driver.FindElement(By.XPath(locator2)).Click();
            //
            userActions.LogConsoleMessage("Verify : Authentication is present ");

            string Authentication_Priority = Actor.AskingFor(Text.Of(TestCases.AuthenticationGroupTC));
            Assert.That(Authentication_Priority, Is.EqualTo("Authentication"));

            string locator3 = "//li[contains(@data-id,'Projects')]//i[contains(@class,'gj-icon')]";
            driver.FindElement(By.XPath(locator3)).Click();

            Actor.WaitsUntil(Appearance.Of(TestCases.HeaderProjectListGroupTC), IsEqualTo.True(), timeout: 60);

            string headerProjectList = Actor.AskingFor(Text.Of(TestCases.HeaderProjectListGroupTC));


            string locator4 = $"(//li[contains(@data-id,'Authentication')]//i[contains(@class,'gj-icon')])[1]";
            driver.FindElement(By.XPath(locator4)).Click();
            userActions.LogConsoleMessage("Verify : Validate login TC is present ");

            string validateLogin = Actor.AskingFor(Text.Of(TestCases.ValidateLoginGroupTC));
            Assert.That(validateLogin.Contains("Validate login"), Is.True);
            Assert.IsNotNull(headerProjectList);
            userActions.LogConsoleMessage("Verify : Header project list validation TC is present ");

            Assert.That(headerProjectList.Contains("Header project list validation"), Is.True);


            userActions.LogConsoleMessage("Click on Suites on header ");

            Actor.AttemptsTo(Click.On(Header.Suites));
            //Verify the SmokeTest is saved / Created
            string suiteName = Actor.AskingFor(Text.Of(TestCases.SuiteNameHeading));

            userActions.LogConsoleMessage("Verify : Smoke Test is created");

            Assert.That(suiteName, Is.EqualTo("Smoke Test"));

            userActions.LogConsoleMessage("Click on view link on Suites ");

            Actor.AttemptsTo(Click.On(TestCases.SuiteViewLink));

            userActions.LogConsoleMessage("Verify : Smoke Test is created with TC list as 4");


            Actor.WaitsUntil(TextList.For(TestCases.TestCaseTreeListMain), IsAnEnumerable<string>.WhereTheCount(IsEqualTo.Value(4)), timeout: 60);

            //Validate the navigation based on the TCs displayed
            ReadOnlyCollection<IWebElement> Suite_TC = TestCases.TestCaseTreeListMain.FindElements(driver);

            Assert.That(Suite_TC.Count, Is.EqualTo(4));

            //Clean up
           userActions.LogConsoleMessage("Clean up : Delete Suite created");
            Actor.AttemptsTo(Click.On(Header.Suites));
            Actor.WaitsUntil(Appearance.Of(TestCases.SuiteRemoveIcon), IsEqualTo.True(), timeout: 60);
            Actor.AttemptsTo(Click.On(TestCases.SuiteRemoveIcon));

            Actor.WaitsUntil(Appearance.Of(TestCases.SuiteRemoveConfirmButton), IsEqualTo.True(), timeout: 60);
            IWebElement element = TestCases.SuiteRemoveConfirmButton.FindElement(driver);
            actions.MoveToElement(element).Click(element).Pause(TimeSpan.FromSeconds(1)).Build().Perform();

        }

        [Test]
        public void TC18LaunchCreateSmokeTest()
        {
            userActions.LogConsoleMessage(TestContext.CurrentContext.Test.MethodName!);
            userActions.LogConsoleMessage("Set Up : ");

            userActions.LogConsoleMessage("Action steps : ");
            //create a group with Functionality and Priority high
            creationAndFilterHelpers.CreateSmokeTest(Actor,driver);

            userActions.LogConsoleMessage("Verify : Smoke Test Launch is created");
            //Assert Smoke test is created
            string title = Actor.AskingFor(Text.Of(TestCases.SmokeTestLaunchTitle));
            Assert.That(title, Is.EqualTo("Smoke Test Launch"));

            userActions.LogConsoleMessage("Verify : Failure message is for test");

            Actor.AttemptsTo(Click.On(TestCases.HeaderProjectListGroupTC));
            //Actuall code - Check if Failure is on the testcase
            Actor.WaitsUntil(Appearance.Of(TestCases.FailureLink), IsEqualTo.True(), timeout: 60);
            Actor.AttemptsTo(Click.On(TestCases.FailureLink));
            Actor.WaitsUntil(Appearance.Of(TestCases.FailureMessage), IsEqualTo.True(), timeout: 60);
            string message = Actor.AskingFor(Text.Of(TestCases.FailureMessage));
            Assert.That(message.Contains("wrong"), Is.EqualTo(true));

            userActions.LogConsoleMessage("Verify : Authentication status is passed");
            string AuthImgSrc = Actor.AskingFor(HtmlAttribute.Of(TestCases.AuthenticationLaunchStatusIcon, "src"));
            StringAssert.Contains("pass", AuthImgSrc);

            string Authentication_Priority = Actor.AskingFor(Text.Of(TestCases.AuthenticationGroupTC));
            Assert.That(Authentication_Priority, Is.EqualTo("Authentication"));
            string validateLogin = Actor.AskingFor(Text.Of(TestCases.ValidateLoginGroupTC));
            Assert.That(validateLogin.Contains("Validate login"), Is.True);

            //
            userActions.LogConsoleMessage("Verify :TestCase status is passed");
            string TestcaseImgSrc = TestCases.TestCaseLaunchStatusIcon.FindElement(driver).GetAttribute("src");
            StringAssert.Contains("pass", TestcaseImgSrc);


            userActions.LogConsoleMessage("Verify : Projects status is Fail");
            string ProjectImgSrc = Actor.AskingFor(HtmlAttribute.Of(TestCases.ProjectsLaunchStatusIcon, "src"));
            StringAssert.Contains("fail", ProjectImgSrc);

            userActions.LogConsoleMessage("Verify : Launch status is skipped");
            string LaunchImgSrc = Actor.AskingFor(HtmlAttribute.Of(TestCases.LaunchLaunchStatusIcon, "src"));
            StringAssert.Contains("skipped", LaunchImgSrc);
            userActions.LogConsoleMessage("Clean up : Delete the Smoke Test Launch");
            //Clean Up
            Actor.AttemptsTo(DeleteLaunch.For(driver));

        }

        [Test]
        //TODO The restart-launch GotoLaunch brings up Modal instead of newly created Launch
        //Need to close the modal explicitly
        public void TC19LaunchRestartFailed()
        {
            //create a group with Functionality and Priority high
            userActions.LogConsoleMessage(TestContext.CurrentContext.Test.MethodName!);
            userActions.LogConsoleMessage("Set Up : ");

            userActions.LogConsoleMessage("Action steps : ");
            creationAndFilterHelpers.CreateSmokeTestReRun(Actor, driver);

            //Verify : the Header Project is updated to pass
            userActions.LogConsoleMessage("Verify : Projects status is Pass");
            string ProjectImgSrc = Actor.AskingFor(HtmlAttribute.Of(TestCases.ProjectsLaunchStatusIcon, "src"));
            StringAssert.Contains("pass", ProjectImgSrc);

            //Clean up:
            userActions.LogConsoleMessage("Clean up : Delete launches");
            Actor.AttemptsTo(DeleteLaunch.For(driver));

        }

        [Test]
        public void TC20LaunchSelectedTestCases()
        {
            userActions.LogConsoleMessage("Set up:");
            userActions.LogConsoleMessage("Action steps:");

            creationAndFilterHelpers.CreateTCLaunches(Actor,driver);

            //Assert Check the title of launch created 
            userActions.LogConsoleMessage("Verify : Launch Testcases is created");
            string title = Actor.AskingFor(Text.Of(TestCases.LaunchTestCasesTitle));
            Assert.That(title, Is.EqualTo("Launch Testcases"));
            //Check the Pass Status 
            userActions.LogConsoleMessage("Verify : The Testcases status is pass");
            Actor.WaitsUntil(TextList.For(TestCases.LaunchTCStatuses), IsAnEnumerable<string>.WhereTheCount(IsEqualTo.Value(11)), timeout: 60);
            ReadOnlyCollection<IWebElement> LaunchTestCaseStatuses = TestCases.LaunchTCStatuses.FindElements(driver);
            foreach (IWebElement tc in LaunchTestCaseStatuses)
            {
                string passImg = tc.GetAttribute("src");
                StringAssert.Contains("pass", passImg);
            }

            //Delete the launch
            userActions.LogConsoleMessage("Clean up : Delete Launch Testcase");
            Actor.AttemptsTo(DeleteLaunch.For(driver));

        }

     //   [Test]
        public void DeleteTestSuite()
        {
            userActions.LogConsoleMessage("Click on the Suites on header");
            Actor.AttemptsTo(Click.On(Header.Suites));
            Actor.WaitsUntil(Appearance.Of(TestCases.SuiteRemoveIcon), IsEqualTo.True(), timeout: 60);
            Actor.AttemptsTo(Click.On(TestCases.SuiteRemoveIcon));

            Actions actions = new Actions(driver);
            Actor.WaitsUntil(Appearance.Of(TestCases.SuiteRemoveConfirmButton), IsEqualTo.True(), timeout: 60);
            IWebElement element = TestCases.SuiteRemoveConfirmButton.FindElement(driver);
            actions.MoveToElement(element).Click(element).Pause(TimeSpan.FromSeconds(1)).Build().Perform();

        }
   //     [Test]
        public void DeleteLaunch_temp()
        {
            // userActions.LogConsoleMessage("Click on the Launches on header");
            Actor.AttemptsTo(Click.On(Header.Launches));

            Actions actions = new Actions(driver);

            Actor.WaitsUntil(Count.Of(Launches.LaunchDelete), IsGreaterThanOrEqualTo.Value(1), timeout: 60);
            ReadOnlyCollection<IWebElement> launches = Launches.LaunchDelete.FindElements(driver);
            int launchCount = launches.Count;
            if (launchCount != 0)
            {
                for (int i = 1; i <= launchCount; i++)
                {
                    string xpath_delete_icon = $"(//tr//button//i[@class='bi-trash'])[1]";
                    IWebElement launch = driver.FindElement(By.XPath(xpath_delete_icon));
                    actions.MoveToElement(launch).Click(launch).Build().Perform();
                }
            }

            actions.Release().Build().Perform();

        }



    }
}
