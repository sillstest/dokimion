using Boa.Constrictor.Screenplay;
using Boa.Constrictor.Selenium;
using Dokimion.Interactions;
using Dokimion.Pages;
using OpenQA.Selenium;
using OpenQA.Selenium.Chrome;
using OpenQA.Selenium.Interactions;
using System.Collections.ObjectModel;

namespace Dokimion.Tests
{
    // Test group for project-level settings. Mirrors the other fixtures: one browser/session for the
    // whole group (created in [OneTimeSetUp], logged in as admin), a per-test [TearDown] that logs
    // failures/screenshots, and a [OneTimeTearDown] that logs out and quits the browser.
    internal class ProjectSettings
    {
        private IActor Actor;
        UserActions userActions;
        // Initialized in [OneTimeSetUp], not the constructor; null-forgiving to satisfy nullable analysis.
        ChromeDriver driver = null!;

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
                //Page is redirected after initial URL
                Actor.AttemptsTo(Wait.Until(Appearance.Of(LoginPage.NameInput), IsEqualTo.True()));
            }
            catch (Exception ex)
            {
                userActions.captureScreenShot(driver, "ProjectSettings");

                count++;
                Actor.AttemptsTo(Wait.Until(Appearance.Of(LoginPage.NameInput), IsEqualTo.True()).ForAnAdditional(3));
                userActions.LogConsoleMessage("Unable to load page : retried with addtionatime on " + count + " " + ex.ToString());
            }

            Actor.WaitsUntil(Appearance.Of(LoginPage.LoginPageWelcomeMsg), IsEqualTo.True());
            var welcomeMessage = Actor.AskingFor(Text.Of(LoginPage.LoginPageWelcomeMsg));
            userActions.LogConsoleMessage("Login Page is loaded successfully on count " + count + " " + welcomeMessage);

            userActions.LogConsoleMessage("Set Up : ");
            userActions.LogConsoleMessage("Login as Admin");
            Actor.AttemptsTo(LoginUser.For(userActions.AdminUser!, userActions.AdminPass!));

            // Always start inside the Dokimion project so every test in this group begins in a known
            // project context.
            userActions.LogConsoleMessage("Open the Dokimion project");
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

        // Click a settings-gear link and confirm the SPA actually navigated to the /settings route
        // before waiting for the page to render. The gear is a react-router <Link>; a plain click can
        // race a just-loaded projects/dashboard view and never fire the client-side navigation (the
        // page renders fine manually, so this is a nav-timing flake, not a missing page - it timed out
        // TC32 waiting for RemoveProjectButton). Poll the URL and re-click until the route changes,
        // then wait for the Remove Project button (a stable "Settings page loaded" marker).
        private void OpenProjectSettings(IWebLocator gear)
        {
            for (int attempt = 0; attempt < 4; attempt++)
            {
                Actor.WaitsUntil(Appearance.Of(gear), IsEqualTo.True(), timeout: 30);
                Actor.AttemptsTo(Hover.Over(gear));
                Actor.AttemptsTo(Click.On(gear));

                bool navigated = false;
                for (int i = 0; i < 10; i++)
                {
                    if (driver.Url.Contains("/settings")) { navigated = true; break; }
                    new Actions(driver).Pause(TimeSpan.FromSeconds(1)).Build().Perform();
                }
                if (navigated) break;
                userActions.LogConsoleMessage("Settings nav did not take (URL still " + driver.Url + "); re-clicking the gear");
            }
            Actor.WaitsUntil(Appearance.Of(ProjectSettingsPage.RemoveProjectButton), IsEqualTo.True(), timeout: 30);
        }

        [Test]
        public void TC32ProjectSettings()
        {
            userActions.LogConsoleMessage(TestContext.CurrentContext.Test.MethodName!);

            // The Users dropdown shows the user's display name with a space between words (e.g.
            // "NormalTester" -> "Normal Tester"): insert a space at the camelCase boundary of the var.
            string normalTesterDisplayName = System.Text.RegularExpressions.Regex.Replace(
                userActions.NormalTester!, "(?<=[a-z])(?=[A-Z])", " ");

            try
            {
                userActions.LogConsoleMessage("Action steps : ");
                userActions.LogConsoleMessage("Click the settings (double-gear) icon to the far right of the Dokimion project title");
                userActions.LogConsoleMessage("Verify : the project Settings page is displayed");
                OpenProjectSettings(ProjectSettingsPage.SettingsGear);

                // If the user is already in the project's Users list (e.g. left over from a prior run),
                // remove it AND save first. react-select hides an already-selected option from the
                // dropdown, so without this the add step below would never see the option.
                // NOTE: a selected user renders as a chip showing the STORED value - the raw
                // "NormalTester" (no space) - whereas the dropdown OPTION shows the display name
                // "Normal Tester". So match the existing chip by the raw var, not the spaced name.
                // The current Users value loads asynchronously, so allow it to render before checking.
                Actor.WaitsUntil(Appearance.Of(ProjectSettingsPage.UsersSelectControl), IsEqualTo.True(), timeout: 30);
                new Actions(driver).Pause(TimeSpan.FromSeconds(3)).Build().Perform();
                IWebLocator existingChipRemove = ProjectSettingsPage.RemoveUserChipButton(userActions.NormalTester!);
                if (Actor.AskingFor(Appearance.Of(existingChipRemove)))
                {
                    userActions.LogConsoleMessage($"'{userActions.NormalTester}' is already in the Users list - removing it and saving before re-adding");
                    Actor.AttemptsTo(Click.On(existingChipRemove));
                    Actor.WaitsUntil(Appearance.Of(existingChipRemove), IsEqualTo.False(), timeout: 15);
                    Actor.AttemptsTo(Click.On(ProjectSettingsPage.SaveSettingsButton));
                    Actor.WaitsUntil(Text.Of(ProjectSettingsPage.SettingsSavedPopup), ContainsSubstring.Text("successfully saved"), timeout: 30);
                }
                else
                {
                    userActions.LogConsoleMessage($"'{userActions.NormalTester}' is not currently in the Users list");
                }

                userActions.LogConsoleMessage($"Add user {normalTesterDisplayName} to the Users list (to the right of the 'Users' label)");
                Actor.WaitsUntil(Appearance.Of(ProjectSettingsPage.UsersSelectControl), IsEqualTo.True(), timeout: 30);
                Actor.AttemptsTo(Click.On(ProjectSettingsPage.UsersSelectControl));
                // Type ONLY the first word of the display name, then pause. The async user suggest
                // populates the dropdown after the first word; typing the full "Normal Tester" (with the
                // space) before pausing re-queries and the option never settles/appears. The backend
                // suggest matches the typed text as a substring of the "value:Display Name" string, so
                // the first word is enough to surface the option.
                string firstWord = normalTesterDisplayName.Split(' ')[0];
                Actor.AttemptsTo(SendKeys.To(ProjectSettingsPage.UsersSelectInput, firstWord));
                new Actions(driver).Pause(TimeSpan.FromSeconds(2)).Build().Perform();

                // The matching option is shown by the full display name.
                userActions.LogConsoleMessage($"Verify : the '{normalTesterDisplayName}' option appears in the dropdown");
                IWebLocator userOption = ProjectSettingsPage.UserOption(normalTesterDisplayName);
                Actor.WaitsUntil(Appearance.Of(userOption), IsEqualTo.True(), timeout: 30);
                userActions.LogConsoleMessage($"Click the '{normalTesterDisplayName}' option");
                Actor.AttemptsTo(Click.On(userOption));

                userActions.LogConsoleMessage("Click the Save button");
                Actor.WaitsUntil(Appearance.Of(ProjectSettingsPage.SaveSettingsButton), IsEqualTo.True(), timeout: 30);
                Actor.AttemptsTo(Click.On(ProjectSettingsPage.SaveSettingsButton));

                userActions.LogConsoleMessage("Verify : the settings-saved confirmation is displayed");
                Actor.WaitsUntil(Text.Of(ProjectSettingsPage.SettingsSavedPopup), ContainsSubstring.Text("successfully saved"), timeout: 30);

                userActions.LogConsoleMessage("Log out of the admin session");
                Actor.AttemptsTo(Logout.For());
                Actor.WaitsUntil(Appearance.Of(LoginPage.NameInput), IsEqualTo.True(), timeout: 30);

                userActions.LogConsoleMessage($"Log in as {userActions.NormalTester}");
                Actor.AttemptsTo(LoginUser.For(userActions.NormalTester!, userActions.NormalTesterPasswd!));

                userActions.LogConsoleMessage("Verify : the Dokimion project is now visible in this user's projects list");
                Actor.WaitsUntil(Appearance.Of(Header.DokimionProject), IsEqualTo.True(), timeout: 30);
                userActions.LogConsoleMessage($"Verified: '{userActions.NormalTester}' can now see the Dokimion project");
            }
            finally
            {
                // Clean up (best-effort, never fails the test): as admin, remove NormalTester from the
                // Dokimion project's Users and Save again, so the project's permissions are left exactly
                // as they started (NormalTester cannot see Dokimion). Match the chip by the raw stored
                // value ("NormalTester", no space) - that is how a selected user renders on reload.
                RemoveNormalTesterFromDokimionUsers(userActions.NormalTester!);
            }
        }

        // Best-effort cleanup for TC32: re-establish an admin session, open the Dokimion project's
        // Settings, remove the NormalTester chip from the Users multi-select (if present), and Save.
        // Never throws - cleanup failures are logged and swallowed.
        private void RemoveNormalTesterFromDokimionUsers(string userDisplayName)
        {
            userActions.LogConsoleMessage($"Clean up : remove '{userDisplayName}' from the Dokimion project's Users (as admin)");
            try
            {
                // Log back in as admin (the test ended logged in as NormalTester).
                try { Actor.AttemptsTo(Logout.For()); } catch { /* may already be logged out */ }
                Actor.WaitsUntil(Appearance.Of(LoginPage.NameInput), IsEqualTo.True(), timeout: 30);
                Actor.AttemptsTo(LoginUser.For(userActions.AdminUser!, userActions.AdminPass!));

                // Verify the Dokimion project is visible to admin (admin lands on the projects list).
                userActions.LogConsoleMessage("Verify : the Dokimion project is visible");
                Actor.WaitsUntil(Appearance.Of(Header.DokimionProject), IsEqualTo.True(), timeout: 30);

                // Click the projects gear icon on the right of the Dokimion project row to open its
                // Settings page (where the Users list is displayed) - directly from the projects list,
                // without opening the project dashboard first.
                userActions.LogConsoleMessage("Click the Dokimion projects-list gear icon to open its Settings (Users list)");
                IWebLocator dokimionGearOnList = ProjectSettingsPage.ProjectListSettingsGear("Dokimion");
                OpenProjectSettings(dokimionGearOnList);
                userActions.LogConsoleMessage("Verify : the Users list is displayed");
                Actor.WaitsUntil(Appearance.Of(ProjectSettingsPage.UsersSelectControl), IsEqualTo.True(), timeout: 30);

                // Wait for the Users field's current value (loaded async) to render the chip, then remove
                // it. If the chip never appears (e.g. the test failed before adding it), there is nothing
                // to clean up.
                IWebLocator removeChip = ProjectSettingsPage.RemoveUserChipButton(userDisplayName);
                bool chipPresent;
                try { Actor.WaitsUntil(Appearance.Of(removeChip), IsEqualTo.True(), timeout: 15); chipPresent = true; }
                catch { chipPresent = false; }

                if (!chipPresent)
                {
                    userActions.LogConsoleMessage($"Clean up : no '{userDisplayName}' chip present - nothing to remove");
                    return;
                }

                Actor.AttemptsTo(Click.On(removeChip));
                Actor.AttemptsTo(Click.On(ProjectSettingsPage.SaveSettingsButton));
                Actor.WaitsUntil(Text.Of(ProjectSettingsPage.SettingsSavedPopup), ContainsSubstring.Text("successfully saved"), timeout: 30);
                userActions.LogConsoleMessage($"Clean up : removed '{userDisplayName}' from the Dokimion project's Users");
            }
            catch (Exception ex)
            {
                userActions.LogConsoleMessage("Clean up (remove NormalTester from Dokimion Users) failed (ignored): " + ex);
            }
        }

    }
}
