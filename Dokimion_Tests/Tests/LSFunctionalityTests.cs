using AngleSharp.Dom;
using Boa.Constrictor.Screenplay;
using Boa.Constrictor.Selenium;
using Dokimion.Interactions;
using Dokimion.Pages;
using NUnit.Framework.Internal;
using OpenQA.Selenium;
using OpenQA.Selenium.Chrome;
using System.Collections.ObjectModel;
using WebDriverManager;
using WebDriverManager.DriverConfigs.Impl;
using WebDriverManager.Helpers;

namespace Dokimion.Tests
{
    //  [Ignore("Ignore a fixture")]

    public class LSFunctionalityTests
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
                //Actor.AttemptsTo(Navigate.ToUrl("http://192.168.56.103"));// userActions.DokimionUrl));
                Actor.AttemptsTo(Navigate.ToUrl(userActions.DokimionUrl));
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
            //
            userActions.LogConsoleMessage("Create Smoke Test Launch, Smoke Test Launch Re-Run, Launch Testcases ");
            CreationAndFilterHelpers creationAndFilterHelpers = new CreationAndFilterHelpers();
            creationAndFilterHelpers.CreateSmokeTestReRun(Actor, driver);
            creationAndFilterHelpers.CreateTCLaunches(Actor, driver);
            userActions.LogConsoleMessage("Completed creating 3 launches for filter and statistics tests ");

        }

        [OneTimeTearDown]
        public void QuitBrowser()
        {
            Actor.AttemptsTo(DeleteLaunch.For(driver));
            Actor.AttemptsTo(Logout.For());
            Actor.AttemptsTo(QuitWebDriver.ForBrowser());
        }

        [TearDown]
        public void TearDownAfterTestCase()
        {
            userActions.TearDownAfterTestcase();
        }

        [Test]
        public void TC21FilterLaunchesOnDateCreated()
        {
            userActions.LogConsoleMessage(TestContext.CurrentContext.Test.MethodName!);
            userActions.LogConsoleMessage("Set up : ");

            userActions.LogConsoleMessage("Action Steps : ");

            userActions.LogConsoleMessage("Click on the Launches on header");
            Actor.AttemptsTo(Click.On(Header.Launches));

            userActions.LogConsoleMessage("Click on the Created Time , start date picker");

            Actor.WaitsUntil(Appearance.Of(Launches.LaunchCreatedDatePicker), IsEqualTo.True(), timeout: 60);
            Actor.AttemptsTo(Click.On(Launches.LaunchCreatedDatePicker));

            DateTime dateTime = DateTime.Now;
            string xpathDay = $"//div[@class='react-calendar__month-view__days']//button//abbr[text()={dateTime.Day}]";

            userActions.LogConsoleMessage("Click on the current date");
            Actor.AttemptsTo(Click.On(new WebLocator("CurrentDay", By.XPath(xpathDay))));

            userActions.LogConsoleMessage("Click on Filter button");
            Actor.AttemptsTo(Click.On(Launches.LaunchFilterButton));

            userActions.LogConsoleMessage("Verify : There are 3 launches created with current date" );
            //Validate if we have 3 rows 
            Actor.WaitsUntil(TextList.For(Launches.LaunchTableRows), IsAnEnumerable<string>.WhereTheCount(IsEqualTo.Value(3)), timeout: 60);
            ReadOnlyCollection<IWebElement> launchRows = Launches.LaunchTableRows.FindElements(driver);
            int noOfRows = launchRows.Count;
            Assert.That(noOfRows.Equals(3), Is.True);

            string currentDate = dateTime.ToString("d MMMM yyyy");

            userActions.LogConsoleMessage("Verify : Launch Testcases created with current date");

            ReadOnlyCollection<IWebElement> Row1tds = launchRows[0].FindElements(By.XPath("./child::td"));
            StringAssert.Contains("Launch Testcases", Row1tds[0].Text);
            StringAssert.Contains(currentDate, Row1tds[3].Text);

            userActions.LogConsoleMessage("Verify : Smoke Test Launch Re-Run created with current date");

            ReadOnlyCollection<IWebElement> Row2tds = launchRows[1].FindElements(By.XPath("./child::td"));
            StringAssert.Contains("Smoke Test Launch Re-Run", Row2tds[0].Text);
            StringAssert.Contains(currentDate, Row2tds[3].Text);

            userActions.LogConsoleMessage("Verify : Smoke Test Launch created with current date");

            ReadOnlyCollection<IWebElement> Row3tds = launchRows[2].FindElements(By.XPath("./child::td"));
            StringAssert.Contains("Smoke Test Launch", Row3tds[0].Text);
            StringAssert.Contains(currentDate, Row3tds[3].Text);

            userActions.LogConsoleMessage("Clean up: Reset Date Filter");
            userActions.LogConsoleMessage("Clean up: Delete Date Selection");

            Actor.AttemptsTo(Click.On(Launches.LaunchDeleteDate));
            userActions.LogConsoleMessage("Clean up: Click on Filter");

            Actor.AttemptsTo(Click.On(Launches.LaunchFilterButton));
            //
            Actor.WaitsUntil(TextList.For(Launches.LaunchTableRows), IsAnEnumerable<string>.WhereTheCount(IsEqualTo.Value(3)), timeout: 60);
            ReadOnlyCollection<IWebElement> launchRowsAfterReset = Launches.LaunchTableRows.FindElements(driver);
            int noOfRowsAfterReset = launchRowsAfterReset.Count;
            Assert.That(noOfRowsAfterReset.Equals(3), Is.True);

        }



        [Test]
        public void TC22FilterLaunchesOnTitle()
        {

            userActions.LogConsoleMessage(TestContext.CurrentContext.Test.MethodName!);

            userActions.LogConsoleMessage("Set up : ");

            userActions.LogConsoleMessage("Action Steps : ");

            userActions.LogConsoleMessage("Click on the Launches on header");
            Actor.AttemptsTo(Click.On(Header.Launches));

            //Filter on Smoke
            userActions.LogConsoleMessage("Enter Smoke on the Launch Name");

            Actor.WaitsUntil(Appearance.Of(Launches.LaunchTitleInput), IsEqualTo.True(), timeout: 60);
            Actor.AttemptsTo(Clear.On(Launches.LaunchTitleInput));
            Actor.AttemptsTo(SendKeys.To(Launches.LaunchTitleInput, "Smoke"));

            userActions.LogConsoleMessage("Click on Filter Button");

            Actor.AttemptsTo(Click.On(Launches.LaunchFilterButton));

            userActions.LogConsoleMessage("Verify : There are 2 launches with name 'Smoke'");

            Actor.WaitsUntil(TextList.For(Launches.LaunchTableRows), IsAnEnumerable<string>.WhereTheCount(IsEqualTo.Value(2)), timeout: 60);
            ReadOnlyCollection<IWebElement> launchRows = Launches.LaunchTableRows.FindElements(driver);

            foreach (IWebElement row in launchRows)
            {
                IWebElement element = row.FindElement(By.XPath("descendant::a"));
                string title = element.Text;

                Assert.That(title.Contains("Smoke"), Is.True);
            }

            //Filter on Re-Run
            userActions.LogConsoleMessage("Enter 'Re-Run' on the Launch Name");

            Actor.WaitsUntil(Appearance.Of(Launches.LaunchTitleInput), IsEqualTo.True(), timeout: 60);
            Actor.AttemptsTo(Clear.On(Launches.LaunchTitleInput));
            Actor.AttemptsTo(SendKeys.To(Launches.LaunchTitleInput, "Re-Run"));

            userActions.LogConsoleMessage("Click on Filter button");

            Actor.AttemptsTo(Click.On(Launches.LaunchFilterButton));

            userActions.LogConsoleMessage("Verify : There is 1 launches with name 'Re-Run'");

            Actor.WaitsUntil(TextList.For(Launches.LaunchTableRows), IsAnEnumerable<string>.WhereTheCount(IsEqualTo.Value(1)), timeout: 60);
            ReadOnlyCollection<IWebElement> launchRowsReRun = Launches.LaunchTableRows.FindElements(driver);

            foreach (IWebElement row in launchRowsReRun)
            {
                IWebElement element = row.FindElement(By.XPath("descendant::a"));
                string title = element.Text;
                Assert.That(title.Contains("Re-Run"), Is.True);
            }

            userActions.LogConsoleMessage("Clean up : Reset Title");

            //Reset the filters
            Actor.WaitsUntil(ValueAttribute.Of(Launches.LaunchTitleInput), ContainsSubstring.Text("Re-Run") );
            Actor.AttemptsTo(SendKeys.To(Launches.LaunchTitleInput, Keys.LeftControl + "a" + Keys.Delete));

            userActions.LogConsoleMessage("Click on Filter button");
            Actor.AttemptsTo(Click.On(Launches.LaunchFilterButton));

            Actor.WaitsUntil(TextList.For(Launches.LaunchTableRows), IsAnEnumerable<string>.WhereTheCount(IsEqualTo.Value(3)), timeout: 60);
            ReadOnlyCollection<IWebElement> launchRowsAfterReset = Launches.LaunchTableRows.FindElements(driver);
            int noOfRowsAfterReset = launchRowsAfterReset.Count;
            Assert.That(noOfRowsAfterReset.Equals(3), Is.True);

        }
        [Test]
        public void TC23StatisticsOverviewTest()
        {
            userActions.LogConsoleMessage(TestContext.CurrentContext.Test.MethodName!);

            userActions.LogConsoleMessage("Set up : ");

            userActions.LogConsoleMessage("Action Steps : ");

            userActions.LogConsoleMessage("Click on the Launches on header");
            Actor.AttemptsTo(Click.On(Header.Launches));

            userActions.LogConsoleMessage("Click on the Statistics link on Launches");

            Actor.WaitsUntil(Appearance.Of(Launches.StatisticsLink), IsEqualTo.True());
            Actor.AttemptsTo(Click.On(Launches.StatisticsLink));

            userActions.LogConsoleMessage("Verify : On the overview tab, Total Launches is 3");

            // Total Launches: 3
            Actor.WaitsUntil(Text.Of(Launches.OverviewRow1), ContainsSubstring.Text("3"), timeout: 60);
           
            DateTime dateTime = DateTime.Now;
           string currentDate = dateTime.ToString("d MMMM yyyy");
            ////First Started: 26 October 2023 10:46
            userActions.LogConsoleMessage("Verify : First started is current date");

            Actor.WaitsUntil(Text.Of(Launches.OverviewRow2), ContainsSubstring.Text(currentDate), timeout: 60);
            //Verify the Heat graphs with
            Actor.WaitsUntil(TextList.For(Launches.OverviewCharts), IsAnEnumerable<string>.WhereTheCount(IsEqualTo.Value(3)), timeout: 60);
            ReadOnlyCollection<IWebElement> chartNames = Launches.OverviewCharts.FindElements(driver);

            userActions.LogConsoleMessage("Verify : There are 3 graphs");

            userActions.LogConsoleMessage("Verify : There is Statuses graph");
            
            Actor.WaitsUntil(Appearance.Of(Launches.StatusesGraph), IsEqualTo.True(), timeout: 45);
            string tempStat = Actor.AskingFor(Text.Of(Launches.StatusesGraph));
            StringAssert.Contains("Statuses", tempStat);

            userActions.LogConsoleMessage("Verify : There is Users graph");
            Actor.WaitsUntil(Appearance.Of(Launches.UsersGraph), IsEqualTo.True(), timeout: 45);
            string Users = Actor.AskingFor(Text.Of(Launches.UsersGraph));
            StringAssert.Contains("Users", Users);

            userActions.LogConsoleMessage("Verify : Launches Statuses Trend");
            Actor.WaitsUntil(Appearance.Of(Launches.LaunchTrendGraph), IsEqualTo.True(), timeout: 45);
            string statusTrend = Actor.AskingFor(Text.Of(Launches.LaunchTrendGraph));
            StringAssert.Contains("Launches Statuses Trend", statusTrend);

            userActions.LogConsoleMessage("Clean up :");
        }

        [Test] 
        public void TC24StatisticsHeatmapTest()
        {
            userActions.LogConsoleMessage(TestContext.CurrentContext.Test.MethodName!);

            userActions.LogConsoleMessage("Set up : ");

            userActions.LogConsoleMessage("Action Steps : ");

            userActions.LogConsoleMessage("Click on the Launches on header");
            Actor.AttemptsTo(Click.On(Header.Launches));

            userActions.LogConsoleMessage("Click on the Statistics link on Launches");

            Actor.WaitsUntil(Appearance.Of(Launches.StatisticsLink), IsEqualTo.True(), timeout:45);
            Actor.AttemptsTo(Click.On(Launches.StatisticsLink));

            userActions.LogConsoleMessage("Click on the Heat Map Tab");

            Actor.WaitsUntil(Appearance.Of(Launches.HeatMapLink), IsEqualTo.True(), timeout:60);
            Actor.AttemptsTo(Click.On(Launches.HeatMapLink));

            userActions.LogConsoleMessage("Click on the Toggle button on 'Header Project list validation'");

            Actor.WaitsUntil(Appearance.Of(Launches.ToggleButton1), IsEqualTo.True(), timeout: 60);
            Actor.AttemptsTo(Click.On(Launches.ToggleButton1));

            userActions.LogConsoleMessage("Verify that Toggle Button is unchecked");
            Actor.WaitsUntil(Appearance.Of(Launches.ToggleUnchecked), IsEqualTo.True(), timeout: 45);
            Actor.WaitsUntil(Appearance.Of(Launches.ToggleButton1), IsEqualTo.True(), timeout: 45);
            var val = Actor.AskingFor(HtmlAttribute.Of(Launches.ToggleButton1, "class")) ;
            StringAssert.DoesNotContain("checked", val);

            userActions.LogConsoleMessage("Clean up: Reset the Toggle Button");
            Actor.AttemptsTo(Click.On(Launches.ToggleButton1));

        }

    }
}
