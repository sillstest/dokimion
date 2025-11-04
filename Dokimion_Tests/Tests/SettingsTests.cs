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
    internal class SettingsTests
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
                // Actor.AttemptsTo(Navigate.ToUrl("http://192.168.56.103"));
                //Page is redirected after initial URL
                Actor.AttemptsTo(Wait.Until(Appearance.Of(LoginPage.NameInput), IsEqualTo.True()));
            }
            catch (Exception ex)
            {
                userActions.captureScreenShot(driver, "SettingsTests");

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
        public void TC25EnvironmentTest()
        {
            userActions.LogConsoleMessage(TestContext.CurrentContext.Test.MethodName!);

            userActions.LogConsoleMessage("Set up : ");

            userActions.LogConsoleMessage("Action Steps : ");

            userActions.LogConsoleMessage("Click on the Dokimion project settings icon on right");

            Actor.WaitsUntil(Appearance.Of(Settings.DokimionProjectSettingsLink), IsEqualTo.True());
            var projectName = Actor.AskingFor(Text.Of(Settings.DokimionProjectSettingsLink));
            StringAssert.Contains("Dokimion", projectName);
            //Different environments have different name for dokimion
            IWebElement dokimionSettingLink ;
          
            try
            {
                dokimionSettingLink = driver.FindElement(By.XPath("//div[@class='card-header']/span/a[contains(@href, 'dokimion/settings')]"));
            }
            catch
            {
                dokimionSettingLink = driver.FindElement(By.XPath("//div[@class='card-header']/span/a[contains(@href, 'Dokimion/settings')]"));
            }

            dokimionSettingLink?.FindElement(By.XPath("(//*[local-name()='svg' and @data-icon='cogs'])[1]")).Click();

            userActions.LogConsoleMessage("Enter Window and Mac in the Environments input");
            Actor.WaitsUntil(Appearance.Of(Settings.EnvironmentInput), IsEqualTo.True(), timeout: 60);
            Actor.AttemptsTo(Clear.On(Settings.EnvironmentInput));
            Actor.AttemptsTo(SendKeys.To(Settings.EnvironmentInput, "Windows" + Keys.Enter + "Mac" + Keys.Enter));

            userActions.LogConsoleMessage("Click on the Save Button");
            Actor.AttemptsTo(Click.On(Settings.SettingsSaveButton));

            Actor.WaitsUntil(Appearance.Of(Settings.DisplayMessage), IsEqualTo.True(), timeout: 60);
            userActions.LogConsoleMessage("Verify : Project Settings successfully saved is displayed");

            ReadOnlyCollection<IWebElement> environments = Settings.EnvironmentList.FindElements(driver);
            Actor.WaitsUntil(TextList.For(Settings.EnvironmentList), IsAnEnumerable<string>.WhereTheCount(IsGreaterThanOrEqualTo.Value(2)), timeout: 60);
            IWebElement env1 = environments[0];
            IWebElement env2 = environments[1];

            userActions.LogConsoleMessage("Verify : Windows is present");
            Assert.IsNotEmpty(env1.Text);
            StringAssert.Contains("Windows", env1.Text);

            userActions.LogConsoleMessage("Verify : Mac is present");
            Assert.IsNotEmpty(env2.Text);
            StringAssert.Contains("Mac", env2.Text);
            //Needed to remove the display message for 2nd confirmation
            Actor.AttemptsTo(Refresh.Browser());

            //Clean Up
            userActions.LogConsoleMessage("Clean up : Delete the Windows and Mac");
            Actor.WaitsUntil(Appearance.Of(Settings.RemoveEnvironments), IsEqualTo.True(), timeout: 60);
            Actor.AttemptsTo(Hover.Over(Settings.RemoveEnvironments));
            Actor.AttemptsTo(Click.On(Settings.RemoveEnvironments));

            userActions.LogConsoleMessage("Clean up : Click on Save button");
            Actor.WaitsUntil(Appearance.Of(Settings.SettingsSaveButton), IsEqualTo.True());
            Actor.AttemptsTo(Click.On(Settings.SettingsSaveButton));
            //
            userActions.LogConsoleMessage("Clean up : Project Settings successfully saved is displayed");
            Actor.WaitsUntil(Text.Of(Settings.DisplayMessage), ContainsSubstring.Text("Project Settings successfully saved"), timeout: 60);
            string message1 = Actor.AskingFor(Text.Of(Settings.DisplayMessage));
            StringAssert.Contains("Project Settings successfully saved", message1);
        }

    }
}
