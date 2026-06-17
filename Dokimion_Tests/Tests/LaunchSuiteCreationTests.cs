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
                 //Actor.AttemptsTo(Navigate.ToUrl("http://192.168.56.103"));// userActions.DokimionUrl));
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
            Actor.AttemptsTo(Hover.Over(TestCases.GroupingSelect));
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

            Actor.AttemptsTo(Hover.Over(TestCases.FilterLocator));
            Actor.AttemptsTo(Click.On(TestCases.FilterLocator));

            userActions.LogConsoleMessage("TC: " + TestCases.TestCaseTreeListMain);

            Actor.WaitsUntil(Appearance.Of(TestCases.NumberOfTestCases), IsEqualTo.True(), timeout: 60);
            ReadOnlyCollection<IWebElement> Tc = TestCases.TestCaseTreeListMain.FindElements(driver);
            userActions.LogConsoleMessage("Verify : There are 6 Testcase groups in the list");

            //Have to wait as the dom changed
            Assert.That(Tc.Count, Is.EqualTo(17));

            //
            ReadOnlyCollection<IWebElement> Group_Filters = TestCases.GroupingBox.FindElements(driver);
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
            IWebLocator projectsWebLocator = new WebLocator("Projects", By.XPath(locator1));
            Actor.WaitsUntil(Appearance.Of(projectsWebLocator), IsEqualTo.True(), timeout: 60);
            Actor.AttemptsTo(Hover.Over(projectsWebLocator));
            Actor.AttemptsTo(Click.On(projectsWebLocator));

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
            for (int i = 0; i < minusSVGS.Count; i++)
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
            try
            {
                //create a group with Functionality and Priority high
                creationAndFilterHelpers.CreateSmokeTest(Actor, driver);

                userActions.LogConsoleMessage("Verify : Smoke Test Launch is created");
                //Assert Smoke test is created
                string title = Actor.AskingFor(Text.Of(TestCases.SmokeTestLaunchTitle));
                Assert.That(title, Is.EqualTo("Smoke Test Launch"));

                userActions.LogConsoleMessage("Verify : Failure message is for test");
                //Need to open the Project to have access 
                userActions.LogConsoleMessage("Click on the Project");
                creationAndFilterHelpers.ExpandLaunchGroup(Actor, driver, "Projects");

                userActions.LogConsoleMessage("Click on the Header Project List Validation TC");
                Actor.WaitsUntil(Appearance.Of(TestCases.HeaderProjectListGroupTC), IsEqualTo.True(), timeout:45);
                Actor.AttemptsTo(Hover.Over(TestCases.HeaderProjectListGroupTC));
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

                userActions.LogConsoleMessage("Click on the Authentication");
                creationAndFilterHelpers.ExpandLaunchGroup(Actor, driver, "Authentication");

                userActions.LogConsoleMessage("Click on the Validate login TC");
                Actor.WaitsUntil(Appearance.Of(TestCases.ValidateLoginGroupTC), IsEqualTo.True(), timeout:45);
                string validateLogin = Actor.AskingFor(Text.Of(TestCases.ValidateLoginGroupTC));
                Assert.That(validateLogin.Contains("Validate login"), Is.True);

                //
                userActions.LogConsoleMessage("Verify :TestCase status is passed");
                string TestcaseImgSrc = TestCases.TestCaseLaunchStatusIcon.FindElement(driver).GetAttribute("src");
                StringAssert.Contains("pass", TestcaseImgSrc);


                userActions.LogConsoleMessage("Verify : Projects status is Fail");
                string ProjectImgSrc = Actor.AskingFor(HtmlAttribute.Of(TestCases.ProjectsLaunchStatusIcon, "src"));
                StringAssert.Contains("fail", ProjectImgSrc);

                userActions.LogConsoleMessage("Verify : Launch status is broken");
                string LaunchImgSrc = Actor.AskingFor(HtmlAttribute.Of(TestCases.LaunchLaunchStatusIcon, "src"));
                StringAssert.Contains("broken", LaunchImgSrc);
            }
            finally
            {
                userActions.LogConsoleMessage("Clean up : Delete the Smoke Test Launch");
                //Clean Up
                Actor.AttemptsTo(DeleteLaunch.For(driver));
            }
        }

        [Test]
        public void TC19LaunchRestartFailed()
        {
            //create a group with Functionality and Priority high
            userActions.LogConsoleMessage(TestContext.CurrentContext.Test.MethodName!);
            userActions.LogConsoleMessage("Set Up : ");

            try
            {
                userActions.LogConsoleMessage("Action steps : ");
                creationAndFilterHelpers.CreateSmokeTestReRun(Actor, driver);

                //Verify : the Header Project is updated to pass
                userActions.LogConsoleMessage("Verify : Projects status is Pass");
                string ProjectImgSrc = Actor.AskingFor(HtmlAttribute.Of(TestCases.ProjectsLaunchStatusIcon, "src"));
                StringAssert.Contains("pass", ProjectImgSrc);
            }
            finally
            {

                //Clean up:
                userActions.LogConsoleMessage("Clean up : Delete launches");
                Actor.AttemptsTo(DeleteLaunch.For(driver));
            }

        }

        [Test]
        public void TC20LaunchSelectedTestCases()
        {
            userActions.LogConsoleMessage("Set up:");
            userActions.LogConsoleMessage("Action steps:");
            try
            {
                creationAndFilterHelpers.CreateTCLaunches(Actor, driver);

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
            }
            finally {

                //Delete the launch
                userActions.LogConsoleMessage("Clean up : Delete Launch Testcase");
                Actor.AttemptsTo(DeleteLaunch.For(driver));
            }
        }

        // Creates a test suite from ALL test cases (no filter applied), using the same save flow as
        // TC17 (the save icon -> name input -> Save in #suite-modal), then deletes it and verifies the
        // suite no longer appears in the Suites window. The create/delete round trip leaves the project
        // exactly as it started.
        [Test]
        public void TC29CreateDeleteTestSuite()
        {
            userActions.LogConsoleMessage(TestContext.CurrentContext.Test.MethodName!);

            const string suiteName = "TempTestSuite";
            IWebLocator suiteCard = SuiteCardByName(suiteName);
            bool created = false;
            try
            {
                userActions.LogConsoleMessage("Action steps : open TestCases with all test cases (no grouping/filter)");
                Actor.AttemptsTo(Click.On(Header.TestCases));
                Actor.WaitsUntil(TextList.For(TestCases.TestCaseTreeListMain), IsAnEnumerable<string>.WhereTheCount(IsGreaterThanOrEqualTo.Value(1)), timeout: 60);

                userActions.LogConsoleMessage($"Create the '{suiteName}' suite from all test cases (same save method as TC17)");
                Actor.AttemptsTo(Click.On(TestCases.SaveSuiteLocator));
                Actor.WaitsUntil(Appearance.Of(TestCases.SuiteNameInput), IsEqualTo.True(), timeout: 45);
                Actor.AttemptsTo(Clear.On(TestCases.SuiteNameInput));
                Actor.AttemptsTo(SendKeys.To(TestCases.SuiteNameInput, suiteName));
                Actor.AttemptsTo(Click.On(TestCases.SuiteSaveButton));

                userActions.LogConsoleMessage("Verify : the suite was created");
                Actor.WaitsUntil(Appearance.Of(TestCases.TestSuiteNameOnTC), IsEqualTo.True(), timeout: 45);
                created = true;

                userActions.LogConsoleMessage($"Verify : '{suiteName}' is listed in the Suites window");
                Actor.AttemptsTo(Click.On(Header.Suites));
                Actor.WaitsUntil(Appearance.Of(suiteCard), IsEqualTo.True(), timeout: 60);

                userActions.LogConsoleMessage("Action steps : delete the temp test suite");
                DeleteSuiteByName(suiteName);
                created = false;

                userActions.LogConsoleMessage("Verify : the temp test suite no longer displays in the Suites window");
                Actor.AttemptsTo(Click.On(Header.Suites));
                Actor.WaitsUntil(Appearance.Of(suiteCard), IsEqualTo.False(), timeout: 60);
                userActions.LogConsoleMessage($"Verified: '{suiteName}' is no longer displayed");
            }
            finally
            {
                // The delete IS the action under test, so only clean up if it never ran (the test
                // failed earlier) - otherwise the suite would leak. Best-effort; never fail from cleanup.
                if (created)
                {
                    userActions.LogConsoleMessage("Clean up : remove the leaked temp test suite");
                    try
                    {
                        Actor.AttemptsTo(Click.On(Header.Suites));
                        DeleteSuiteByName(suiteName);
                    }
                    catch (Exception ex) { userActions.LogConsoleMessage("Cleanup (Delete temp suite) failed (ignored): " + ex); }
                }
            }
        }

        // Locator for a test-suite card on the Suites window by its (exact) name. SuiteNameHeading is
        // not reused because it is hard-coded to "Smoke Test".
        private IWebLocator SuiteCardByName(string suiteName) =>
            new WebLocator("SuiteCard:" + suiteName,
                By.XPath($"//div[contains(@class,'testsuite-card')][.//h5[text()='{suiteName}']]"));

        // Delete the named test suite from the Suites window, then confirm the removal dialog. The
        // remove icon is scoped to the matching suite's card (rather than the first minus-circle on the
        // page) so other suites are never deleted by mistake.
        private void DeleteSuiteByName(string suiteName)
        {
            IWebLocator removeIcon = new WebLocator("SuiteRemoveIcon:" + suiteName,
                By.XPath($"//div[contains(@class,'testsuite-card')][.//h5[text()='{suiteName}']]//*[local-name()='svg' and @data-icon='minus-circle']"));
            Actor.WaitsUntil(Appearance.Of(removeIcon), IsEqualTo.True(), timeout: 60);
            Actor.AttemptsTo(Click.On(removeIcon));

            Actor.WaitsUntil(Appearance.Of(TestCases.SuiteRemoveConfirmButton), IsEqualTo.True(), timeout: 60);
            IWebElement element = TestCases.SuiteRemoveConfirmButton.FindElement(driver);
            new Actions(driver).MoveToElement(element).Click(element).Pause(TimeSpan.FromSeconds(1)).Build().Perform();
        }

        // Creates two temp launches from all test cases (TC18/TC30 launch-save flow), named "Temp1" and
        // "Pmet1" (chosen so a "Temp" search matches only "Temp1" - "Pmet1" has no "temp" substring).
        // Searches the Launches window for "Temp" and verifies only "Temp1" is shown, then clears the
        // Search box and clicks Filter so both launches list again, deletes both via their trash icons,
        // and verifies both are gone. The round trip leaves the project as it started.
        [Test]
        public void TC30CreateDeleteLaunch()
        {
            userActions.LogConsoleMessage(TestContext.CurrentContext.Test.MethodName!);

            const string launch1 = "Temp1";
            const string launch2 = "Pmet1";
            // True once a launch may exist on the server; set before creation so a partial failure still
            // triggers cleanup, and cleared once both trash-icon deletes succeed.
            bool launchesMayExist = false;
            try
            {
                userActions.LogConsoleMessage("Set Up : remove any leftover temp launches from a prior run (idempotent start)");
                PurgeLaunchesByName(launch1, launch2);

                userActions.LogConsoleMessage($"Set Up : create two temp launches '{launch1}' and '{launch2}' from all test cases");
                launchesMayExist = true;
                CreateLaunchFromAllTestCases(launch1);
                CreateLaunchFromAllTestCases(launch2);

                userActions.LogConsoleMessage("Action steps : open the Launches window and search 'Temp'");
                Actor.AttemptsTo(Click.On(Header.Launches));
                IWebLocator launchTitleSearch = new WebLocator("LaunchTitleSearch",
                    By.XPath("//div[contains(@class,'launch-filter')]//input[@id='name']"));
                Actor.WaitsUntil(Appearance.Of(launchTitleSearch), IsEqualTo.True(), timeout: 60);
                Actor.AttemptsTo(Clear.On(launchTitleSearch));
                Actor.AttemptsTo(SendKeys.To(launchTitleSearch, "Temp"));
                Actor.AttemptsTo(Click.On(Launches.LaunchFilterButton));

                IWebLocator temp1Link = new WebLocator("Temp1Link", By.XPath($"//table//tr//a[text()='{launch1}']"));
                IWebLocator pmet1Link = new WebLocator("Pmet1Link", By.XPath($"//table//tr//a[text()='{launch2}']"));

                userActions.LogConsoleMessage($"Verify : only '{launch1}' is displayed (not '{launch2}')");
                Actor.WaitsUntil(Appearance.Of(temp1Link), IsEqualTo.True(), timeout: 60);
                Actor.WaitsUntil(Appearance.Of(pmet1Link), IsEqualTo.False(), timeout: 30);
                userActions.LogConsoleMessage($"Verified: searching 'Temp' displays only '{launch1}'");

                userActions.LogConsoleMessage("Clear the Search box and click Filter so both launches list again");
                // Clear via select-all + Delete (real key events) rather than Clear.On: the launch
                // title box is a React controlled input, and Selenium's clear() does not reliably fire
                // the onChange that resets the like_name filter - leaving the "Temp" filter in place so
                // Pmet1 never reappears (the line-655 timeout).
                IWebElement searchBox = launchTitleSearch.FindElement(driver);
                searchBox.SendKeys(Keys.Control + "a");
                searchBox.SendKeys(Keys.Delete);
                Actor.AttemptsTo(Click.On(Launches.LaunchFilterButton));
                Actor.WaitsUntil(Appearance.Of(pmet1Link), IsEqualTo.True(), timeout: 60);

                userActions.LogConsoleMessage("Action steps : delete both temp launches via their trash icons");
                DeleteLaunchByName(launch1);
                DeleteLaunchByName(launch2);
                launchesMayExist = false;

                userActions.LogConsoleMessage("Verify : both temp launches are gone from the list");
                Actor.AttemptsTo(Click.On(Header.Launches));
                Actor.WaitsUntil(Appearance.Of(temp1Link), IsEqualTo.False(), timeout: 60);
                Actor.WaitsUntil(Appearance.Of(pmet1Link), IsEqualTo.False(), timeout: 60);
                userActions.LogConsoleMessage("Verified: both temp launches are no longer displayed");
            }
            finally
            {
                // Safety net: if a launch may still exist (a create failed midway, or a trash-icon
                // delete failed), remove our OWN launches by name. Do NOT use DeleteLaunch.For(driver)
                // here: it deletes EVERY launch in Dokimion_LS, including the seed launches that
                // LSFunctionalityTests (TC22/TC23) depend on. DeleteLaunchByName no-ops if the launch
                // is already gone. Skipped after a clean delete.
                if (launchesMayExist)
                {
                    userActions.LogConsoleMessage("Clean up : remove the temp launches if still present");
                    try
                    {
                        Actor.AttemptsTo(Click.On(Header.Launches));
                        DeleteLaunchByName(launch1);
                        DeleteLaunchByName(launch2);
                    }
                    catch (Exception ex) { userActions.LogConsoleMessage("Cleanup (Delete launches) failed (ignored): " + ex); }
                }
            }
        }

        // Delete the named launch from the Launches window by clicking the trash icon in its row.
        // Scoped to the matching row so other launches are untouched. There is no confirmation dialog
        // (clicking the trash icon deletes immediately - see DeleteLaunch.cs), and a swallowed click
        // would otherwise leave the launch behind silently - so click, confirm the row disappears, and
        // re-click if it did not. The loop also clears any duplicate of the same name (a leftover from
        // an earlier swallowed delete) since it repeats until no matching launch link remains.
        private void DeleteLaunchByName(string launchName)
        {
            IWebLocator launchLink = new WebLocator("LaunchLink:" + launchName,
                By.XPath($"//table//tr//a[text()='{launchName}']"));
            IWebLocator trashIcon = new WebLocator("LaunchTrash:" + launchName,
                By.XPath($"//table//tr[.//a[text()='{launchName}']]//button//i[@class='bi-trash']"));

            for (int attempt = 0; attempt < 3; attempt++)
            {
                if (!Actor.AskingFor(Appearance.Of(launchLink))) return; // gone

                Actor.WaitsUntil(Appearance.Of(trashIcon), IsEqualTo.True(), timeout: 60);
                new Actions(driver).MoveToElement(trashIcon.FindElement(driver)).Click().Build().Perform();

                for (int i = 0; i < 10; i++)
                {
                    if (!Actor.AskingFor(Appearance.Of(launchLink))) return; // deleted
                    new Actions(driver).Pause(TimeSpan.FromSeconds(1)).Build().Perform();
                }
            }

            // Surface a genuine failure clearly if it never got deleted.
            Actor.WaitsUntil(Appearance.Of(launchLink), IsEqualTo.False(), timeout: 30);
        }

        // Idempotent setup: open the Launches window and delete any pre-existing launches with the
        // given names (leftovers from an aborted prior run). This keeps a stray launch from
        // accumulating across runs and breaking the seed launch-count assertions in
        // LSFunctionalityTests (TC22/TC23). DeleteLaunchByName no-ops if a name is not present.
        private void PurgeLaunchesByName(params string[] launchNames)
        {
            Actor.AttemptsTo(Click.On(Header.Launches));
            Actor.WaitsUntil(Appearance.Of(Launches.LaunchFilterButton), IsEqualTo.True(), timeout: 60);

            // Wait for the async launch fetch to finish before checking for leftovers. Dokimion_LS
            // legitimately has ZERO launches when this suite runs - the 3 launches TC22/TC23 use are
            // created in LSFunctionalityTests' OWN setup and deleted in its teardown, they are not
            // persistent seed - so we must NOT wait for a row (that would time out on an empty list).
            // Instead wait for the loading spinner to clear: the FadeLoader inside .sweet-loading is
            // rendered only while loading and nothing once the fetch completes. A brief settle then
            // lets the (possibly empty) table render before we look for a named leftover.
            IWebLocator launchesLoading = new WebLocator("LaunchesLoadingSpinner",
                By.XPath("//div[contains(@class,'sweet-loading')]//span"));
            Actor.WaitsUntil(Appearance.Of(launchesLoading), IsEqualTo.False(), timeout: 60);
            new Actions(driver).Pause(TimeSpan.FromSeconds(1)).Build().Perform();

            foreach (string name in launchNames)
            {
                DeleteLaunchByName(name);
            }
        }

        // Verifies the Launches list title search does a case-insensitive partial match. The launch is
        // named "Temp Launch" (rather than CreateSmokeTest's hard-coded "Smoke Test Launch") so that the
        // requested search term "Temp" has something to match; it is created with the same launch-save
        // flow as TC18/TC30. On the Launches window, types the LOWER-case partial "temp" and clicks
        // Filter, then confirms "Temp Launch" is still selected - proving the match ignores case. The
        // launch is deleted in cleanup so the project is left as it started.
        [Test]
        public void TC31SearchLaunchByTitle()
        {
            userActions.LogConsoleMessage(TestContext.CurrentContext.Test.MethodName!);

            const string launchName = "Temp Launch";
            // True once the launch may exist on the server; set before creation so a partial failure
            // still triggers cleanup, and cleared once the trash-icon delete succeeds.
            bool launchMayExist = false;
            try
            {
                userActions.LogConsoleMessage($"Set Up : remove any leftover '{launchName}' from a prior run (idempotent start)");
                PurgeLaunchesByName(launchName);

                userActions.LogConsoleMessage($"Set Up : create the temp launch '{launchName}' (TC18/TC30 launch-save flow)");
                launchMayExist = true;
                CreateLaunchFromAllTestCases(launchName);

                userActions.LogConsoleMessage("Action steps : open the Launches window and search the lower-case partial 'temp'");
                Actor.AttemptsTo(Click.On(Header.Launches));

                IWebLocator launchTitleSearch = new WebLocator("LaunchTitleSearch",
                    By.XPath("//div[contains(@class,'launch-filter')]//input[@id='name']"));
                Actor.WaitsUntil(Appearance.Of(launchTitleSearch), IsEqualTo.True(), timeout: 60);
                Actor.AttemptsTo(Clear.On(launchTitleSearch));
                Actor.AttemptsTo(SendKeys.To(launchTitleSearch, "temp"));
                Actor.AttemptsTo(Click.On(Launches.LaunchFilterButton));

                userActions.LogConsoleMessage($"Verify : the case-insensitive search selects '{launchName}'");
                IWebLocator tempLaunchLink = new WebLocator("TempLaunchLink",
                    By.XPath($"//table//tr//a[text()='{launchName}']"));
                Actor.WaitsUntil(Appearance.Of(tempLaunchLink), IsEqualTo.True(), timeout: 60);
                userActions.LogConsoleMessage($"Verified: searching 'temp' selected '{launchName}' (case-insensitive match)");

                // Clear the search so the delete runs against the FULL launch list, then verify the
                // launch is gone via a FRESH navigation - the same pattern TC30 uses and that works.
                // Deleting from the filtered view was unreliable: the row could vanish from the filtered
                // results without the launch actually being removed, so the in-place check passed while
                // "Temp Launch" survived. A fresh re-fetch confirms it is truly deleted on the server.
                userActions.LogConsoleMessage("Clear the Search box so the delete runs against the full launch list");
                IWebElement searchBox = launchTitleSearch.FindElement(driver);
                searchBox.SendKeys(Keys.Control + "a");
                searchBox.SendKeys(Keys.Delete);
                Actor.AttemptsTo(Click.On(Launches.LaunchFilterButton));
                Actor.WaitsUntil(Appearance.Of(tempLaunchLink), IsEqualTo.True(), timeout: 60);

                userActions.LogConsoleMessage("Clean up : delete the temp launch via its trash icon");
                DeleteLaunchByName(launchName);

                userActions.LogConsoleMessage("Verify : the temp launch is gone from the list (fresh navigation)");
                Actor.AttemptsTo(Click.On(Header.Launches));
                Actor.WaitsUntil(Appearance.Of(tempLaunchLink), IsEqualTo.False(), timeout: 60);
                launchMayExist = false;
            }
            finally
            {
                // Safety net: if the launch may still exist (create failed midway, or the trash-icon
                // delete failed), remove our OWN launch by name. Do NOT use DeleteLaunch.For(driver)
                // here: it deletes EVERY launch in Dokimion_LS, including the seed launches that
                // LSFunctionalityTests (TC22/TC23) depend on. DeleteLaunchByName no-ops if already gone.
                if (launchMayExist)
                {
                    userActions.LogConsoleMessage("Clean up : remove the temp launch if still present");
                    try
                    {
                        Actor.AttemptsTo(Click.On(Header.Launches));
                        DeleteLaunchByName(launchName);
                    }
                    catch (Exception ex) { userActions.LogConsoleMessage("Cleanup (Delete launch) failed (ignored): " + ex); }
                }
            }
        }

        // Create a launch from all test cases with the given name, using the same launch-save flow as
        // CreateSmokeTest (save icon -> name input -> Create -> Go To Launch), minus the filter and the
        // per-test-case status updates - TC31 only needs the launch to exist so its title can be searched.
        private void CreateLaunchFromAllTestCases(string launchName)
        {
            Actor.AttemptsTo(Click.On(Header.TestCases));
            Actor.WaitsUntil(TextList.For(TestCases.TestCaseTreeListMain), IsAnEnumerable<string>.WhereTheCount(IsGreaterThanOrEqualTo.Value(1)), timeout: 60);

            Actor.AttemptsTo(Click.On(TestCases.LaunchSaveButton));
            Actor.WaitsUntil(Appearance.Of(TestCases.LaunchNameInput), IsEqualTo.True(), timeout: 60);
            Actor.AttemptsTo(Clear.On(TestCases.LaunchNameInput));
            Actor.AttemptsTo(SendKeys.To(TestCases.LaunchNameInput, launchName));
            Actor.AttemptsTo(Click.On(TestCases.LaunchCreateButton));
            Actor.WaitsUntil(Appearance.Of(TestCases.GoToLaunchLink), IsEqualTo.True(), timeout: 60);
            Actor.AttemptsTo(Click.On(TestCases.GoToLaunchLink));
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
