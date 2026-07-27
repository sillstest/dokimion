using Boa.Constrictor.Screenplay;
using Boa.Constrictor.Selenium;
using Dokimion.Interactions;
using Dokimion.Pages;
using NUnit.Framework.Internal;
using OpenQA.Selenium;
using OpenQA.Selenium.Chrome;
using OpenQA.Selenium.Interactions;
using System.Collections.ObjectModel;

namespace Dokimion.Tests
{

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
            // Idempotent start: an aborted prior run leaves its launches behind (the teardown below
            // never ran), and TC22/TC23 assert EXACT launch counts - a single leftover "Smoke Test
            // Launch" makes TC22's "2 rows match Smoke" wait fail. Clear the slate first.
            userActions.LogConsoleMessage("Set Up : remove any leftover launches from an aborted prior run");
            PurgeAllLaunches();

            try
            {
                userActions.LogConsoleMessage("Create Smoke Test Launch, Smoke Test Launch Re-Run, Launch Testcases ");
                CreationAndFilterHelpers creationAndFilterHelpers = new CreationAndFilterHelpers();
                creationAndFilterHelpers.CreateSmokeTestReRun(Actor, driver);
                creationAndFilterHelpers.CreateTCLaunches(Actor, driver);
                userActions.LogConsoleMessage("Completed creating 3 launches for filter and statistics tests ");
            }
            catch (Exception e)
            {
                // Do NOT swallow: every test in this fixture asserts against these 3 launches, so a
                // half-created set produced a confusing count timeout inside TC22/TC23 (a 60s wait on
                // "2 rows") instead of pointing at the real failure here. Fail the fixture loudly.
                userActions.LogConsoleMessage("Error occured on setup :Create Smoke Test Launch, Smoke Test Launch Re-Run, Launch Testcases ");
                userActions.LogConsoleMessage(e.ToString());
                userActions.captureScreenShot(driver, "LSFunctionalityTestsSetup");
                throw;
            }

            // Confirm the fixture's data precondition before any test runs, and say exactly what is
            // there if it does not hold.
            userActions.LogConsoleMessage("Verify Set Up : the 3 launches exist before running the tests");
            Actor.AttemptsTo(Click.On(Header.Launches));
            AssertLaunchRowCount(3, "Set Up (launch creation)");
        }

        [OneTimeTearDown]
        public void QuitBrowser()
        {
            // PurgeAllLaunches rather than DeleteLaunch.For(driver): DeleteLaunch waits for at least
            // one trash icon and THROWS when the list is empty, so a run that created no launches
            // would fail in teardown and mask the real error. PurgeAllLaunches no-ops on an empty list.
            try { PurgeAllLaunches(); }
            catch (Exception ex) { userActions.LogConsoleMessage("Teardown (purge launches) failed (ignored): " + ex.Message); }

            Actor.AttemptsTo(Logout.For());
            Actor.AttemptsTo(QuitWebDriver.ForBrowser());
        }

        // Open the Launches window and delete every launch present, leaving an empty list. Safe to
        // call when there are none (unlike DeleteLaunch.For, which waits for a row and throws on an
        // empty list). The table re-renders after each delete, so re-query the icons every pass.
        private void PurgeAllLaunches()
        {
            Actor.AttemptsTo(Click.On(Header.Launches));
            Actor.WaitsUntil(Appearance.Of(Launches.LaunchFilterButton), IsEqualTo.True(), timeout: 60);

            // Wait for the async launch fetch to finish. The project legitimately has ZERO launches on
            // a clean run, so we must not wait for a row (that would time out) - wait for the loading
            // spinner to clear instead, then let the (possibly empty) table render.
            IWebLocator launchesLoading = new WebLocator("LaunchesLoadingSpinner",
                By.XPath("//div[contains(@class,'sweet-loading')]//span"));
            Actor.WaitsUntil(Appearance.Of(launchesLoading), IsEqualTo.False(), timeout: 60);
            new Actions(driver).Pause(TimeSpan.FromSeconds(1)).Build().Perform();

            for (int pass = 0; pass < 30; pass++)
            {
                ReadOnlyCollection<IWebElement> trashIcons;
                try { trashIcons = Launches.LaunchDelete.FindElements(driver); }
                catch (StaleElementReferenceException) { continue; }

                if (trashIcons.Count == 0) return; // nothing (left) to delete

                try
                {
                    new Actions(driver).MoveToElement(trashIcons[0]).Click().Build().Perform();
                    new Actions(driver).Pause(TimeSpan.FromSeconds(1)).Build().Perform();
                }
                catch (Exception ex)
                {
                    // The row may have been removed between find and click; re-query on the next pass.
                    userActions.LogConsoleMessage("Purge launch hit a transient error (will re-check): " + ex.Message);
                }
            }
        }

        // Wait for the Launches table to hold exactly `expected` rows, and on timeout fail with the
        // launch titles actually present. The bare WaitsUntil only reports "text list ... timed out",
        // which does not say whether the filter failed to apply, a launch was never created, or a
        // leftover from a prior run is still there.
        private void AssertLaunchRowCount(int expected, string context)
        {
            try
            {
                Actor.WaitsUntil(TextList.For(Launches.LaunchTableRows),
                    IsAnEnumerable<string>.WhereTheCount(IsEqualTo.Value(expected)), timeout: 60);
            }
            catch (Exception)
            {
                List<string> titles = CurrentLaunchTitles();
                Assert.Fail($"{context}: expected {expected} launch row(s) but found {titles.Count} " +
                            $"- [{string.Join(" | ", titles)}]. More rows than expected usually means a leftover " +
                            $"launch from an aborted run or a filter that did not apply; fewer means a launch was " +
                            $"never created in Set Up.");
            }
        }

        // Titles of the launches currently listed (the <a> in each row). Best-effort - used only to
        // make a failure message actionable.
        private List<string> CurrentLaunchTitles()
        {
            try
            {
                return Launches.LaunchTableRows.FindElements(driver)
                    .Select(row =>
                    {
                        try { return row.FindElement(By.XPath("descendant::a")).Text; }
                        catch (Exception) { return row.Text; }
                    })
                    .ToList();
            }
            catch (Exception) { return new List<string>(); }
        }

        // Replace the Launches title Search box contents with `text` (pass "" to clear it). Uses real
        // select-all + Delete key events rather than Clear.On: this is a React controlled input and
        // Selenium's clear() does not reliably fire the onChange that updates the like_name filter -
        // the same trap documented in LaunchSuiteCreationTests TC30, where a stale filter silently
        // left the previous term applied.
        private void SetLaunchTitleFilter(string text)
        {
            Actor.WaitsUntil(Appearance.Of(Launches.LaunchTitleInput), IsEqualTo.True(), timeout: 60);
            IWebElement searchBox = Launches.LaunchTitleInput.FindElement(driver);
            searchBox.SendKeys(Keys.Control + "a");
            searchBox.SendKeys(Keys.Delete);
            if (!string.IsNullOrEmpty(text)) searchBox.SendKeys(text);
        }

        [TearDown]
        public void TearDownAfterTestCase()
        {
            userActions.TearDownAfterTestcase();
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

            SetLaunchTitleFilter("Smoke");

            userActions.LogConsoleMessage("Click on Filter Button");

            Actor.AttemptsTo(Click.On(Launches.LaunchFilterButton));

            userActions.LogConsoleMessage("Verify : There are 2 launches with name 'Smoke'");

            AssertLaunchRowCount(2, "Filter on 'Smoke'");
            ReadOnlyCollection<IWebElement> launchRows = Launches.LaunchTableRows.FindElements(driver);

            foreach (IWebElement row in launchRows)
            {
                IWebElement element = row.FindElement(By.XPath("descendant::a"));
                string title = element.Text;

                Assert.That(title.Contains("Smoke"), Is.True);
            }

            //Filter on Re-Run
            userActions.LogConsoleMessage("Enter 'Re-Run' on the Launch Name");

            SetLaunchTitleFilter("Re-Run");

            userActions.LogConsoleMessage("Click on Filter button");

            Actor.AttemptsTo(Click.On(Launches.LaunchFilterButton));

            userActions.LogConsoleMessage("Verify : There is 1 launches with name 'Re-Run'");

            AssertLaunchRowCount(1, "Filter on 'Re-Run'");
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
            SetLaunchTitleFilter("");

            userActions.LogConsoleMessage("Click on Filter button");
            Actor.AttemptsTo(Click.On(Launches.LaunchFilterButton));

            AssertLaunchRowCount(3, "Filter reset (all launches)");
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

            // The Statistics page no longer has an Overview/Heatmap tab bar (removed in the
            // React 18 rewrite), and the Highcharts charts don't render on the first
            // navigation to the statistics route. Re-enter Statistics via the menu bar so the
            // charts mount on the second load.
            Actor.AttemptsTo(Click.On(Header.Launches));
            Actor.WaitsUntil(Appearance.Of(Launches.StatisticsLink), IsEqualTo.True());
            Actor.AttemptsTo(Click.On(Launches.StatisticsLink));
            Actor.WaitsUntil(Text.Of(Launches.OverviewRow1), ContainsSubstring.Text("3"), timeout: 60);

            DateTime dateTime = DateTime.Now;
            string currentDate = dateTime.ToString("d MMMM yyyy");
            ////First Started: 26 October 2023 10:46
            userActions.LogConsoleMessage("Verify : First started is current date");

            Actor.WaitsUntil(Text.Of(Launches.OverviewRow2), ContainsSubstring.Text(currentDate), timeout: 60);
            // Verify the chart titles. These are SVG <text> nodes: Selenium's Displayed check
            // is unreliable for SVG, so use Existence (DOM presence) rather than Appearance.
            Actor.WaitsUntil(Existence.Of(Launches.OverviewCharts), IsEqualTo.True(), timeout: 60);
            Actor.WaitsUntil(TextList.For(Launches.OverviewCharts), IsAnEnumerable<string>.WhereTheCount(IsEqualTo.Value(4)), timeout: 60);
            ReadOnlyCollection<IWebElement> chartNames = Launches.OverviewCharts.FindElements(driver);

            userActions.LogConsoleMessage("Verify : There are 4 graphs");

            userActions.LogConsoleMessage("Verify : There is Statuses graph");

            // Read textContent (not Text): Selenium's IWebElement.Text returns empty for SVG <text>.
            Actor.WaitsUntil(Existence.Of(Launches.StatusesGraph), IsEqualTo.True(), timeout: 45);
            string tempStat = Actor.AskingFor(HtmlAttribute.Of(Launches.StatusesGraph, "textContent"));
            StringAssert.Contains("Statuses", tempStat);

            userActions.LogConsoleMessage("Verify : There is Users graph");
            Actor.WaitsUntil(Existence.Of(Launches.UsersGraph), IsEqualTo.True(), timeout: 45);
            string Users = Actor.AskingFor(HtmlAttribute.Of(Launches.UsersGraph, "textContent"));
            StringAssert.Contains("Users", Users);

            userActions.LogConsoleMessage("Verify : Launches Statuses Trend");
            Actor.WaitsUntil(Existence.Of(Launches.LaunchTrendGraph), IsEqualTo.True(), timeout: 45);
            string statusTrend = Actor.AskingFor(HtmlAttribute.Of(Launches.LaunchTrendGraph, "textContent"));
            StringAssert.Contains("Launches Statuses Trend", statusTrend);

            userActions.LogConsoleMessage("Verify : Launches Time Duration Trend");
            Actor.WaitsUntil(Existence.Of(Launches.LaunchUserExecTrendGraph), IsEqualTo.True(), timeout: 45);
            string userExecTrend = Actor.AskingFor(HtmlAttribute.Of(Launches.LaunchUserExecTrendGraph, "textContent"));
            StringAssert.Contains("Launches Time Duration Trend", userExecTrend);

            userActions.LogConsoleMessage("Clean up :");
        }


    }
}
