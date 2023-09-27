using Dokimion.Interactions;
using Dokimion.Pages;
using Boa.Constrictor.Screenplay;
using Boa.Constrictor.Selenium;
using OpenQA.Selenium.Chrome;
using OpenQA.Selenium;
using WebDriverManager;
using WebDriverManager.DriverConfigs.Impl;
using WebDriverManager.Helpers;
using OpenQA.Selenium.Interactions;

namespace Dokimion.Tests
{
    internal class LoginPageTest
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
        }


        [OneTimeTearDown]
        public void QuitBrowser()
        {
            Actor.AttemptsTo(QuitWebDriver.ForBrowser());
        }

        [TearDown]
        public void TearDownAfterTestCase()
        {
            userActions.TearDownAfterTestcase();
        }

        [Test]
        public void TC1LoginValidPage()
        {
            userActions.LogConsoleMessage(TestContext.CurrentContext.Test.MethodName!);
            userActions.LogConsoleMessage("Set Up : ");

            userActions.LogConsoleMessage("Action steps : ");
            userActions.LogConsoleMessage("Enter the Username : ");

            Actor.WaitsUntil(Appearance.Of(LoginPage.NameInput), IsEqualTo.True());
            Actor.AttemptsTo(Clear.On(LoginPage.NameInput));
            Actor.AttemptsTo(SendKeys.To(LoginPage.NameInput, userActions.Username));

            userActions.LogConsoleMessage("Enter the password : ");
            Actor.WaitsUntil(Appearance.Of(LoginPage.PasswordInput), IsEqualTo.True());
            Actor.AttemptsTo(Clear.On(LoginPage.PasswordInput));
            Actor.AttemptsTo(SendKeys.To(LoginPage.PasswordInput, userActions.Password));

            userActions.LogConsoleMessage("Click Sign in button");
            LoginPage.SingInButton.FindElement(driver).Click();
            userActions.LogConsoleMessage("Submit clicked");
            try
            {
                userActions.LogConsoleMessage("Verify : Username is on top right menu");
                var displayNameAppeared = Actor.AsksFor(Appearance.Of(Header.UserInfo));
                if (!displayNameAppeared)
                {
                    userActions.LogConsoleMessage("Wait till user name is displayed");
                    Actor.AttemptsTo(Wait.Until(Appearance.Of(Header.UserInfo), IsEqualTo.True()).ForAnAdditional(15));

                }

                Actor.WaitsUntil(Text.Of(Header.UserInfo), ContainsSubstring.Text(userActions.DisplayUserName), timeout: 60
                   );
                userActions.LogConsoleMessage("Page redirected after click");
            }catch  (Exception e) {
                userActions.LogConsoleMessage("Page Not redirected , try to login again , Click did not work" + e);
                var headerUserNameDisplayed = Actor.AsksFor(Appearance.Of(Header.UserInfo));
                var loginWelComePage = Actor.AskingFor(Appearance.Of(LoginPage.LoginPageWelcomeMsg));
                if (!headerUserNameDisplayed)
                {
                    userActions.LogConsoleMessage("Wait till user name is displayed");
                    Actor.AttemptsTo(Wait.Until(Appearance.Of(Header.UserInfo), IsEqualTo.True()).ForAnAdditional(15));

                }
                else if (loginWelComePage)
                {
                    Actor.AttemptsTo(Wait.Until(Appearance.Of(LoginPage.LoginPageWelcomeMsg), IsEqualTo.True()).ForAnAdditional(15));
                    Actor.AttemptsTo(LoginUser.For(userActions.Username!, userActions.Password!));

                    Actions actions = new Actions(driver);
                    actions.Pause(TimeSpan.FromSeconds(1)).Build().Perform();
                    Actor.WaitsUntil(Text.Of(Header.UserInfo), ContainsSubstring.Text(userActions.DisplayUserName),
                    timeout: 60);
                }
            }
            finally
            {
                userActions.LogConsoleMessage("Clean up : Logout User");
                var elementAppreared = Actor.AsksFor(Appearance.Of(Header.UserInfo));
                if (!elementAppreared)
                {
                    Actor.AttemptsTo(Wait.Until(Appearance.Of(Header.UserInfo), IsEqualTo.True()).ForAnAdditional(15));

                }
                Actor.AttemptsTo(Logout.For());
               userActions.LogConsoleMessage("Logged out successfully!! ");
            }

        }


        [Test]
        public void TC2LoginInvalidUser()
        {
            userActions.LogConsoleMessage(TestContext.CurrentContext.Test.MethodName!);
            userActions.LogConsoleMessage("Set Up : ");

            userActions.LogConsoleMessage("Action steps : ");
            userActions.LogConsoleMessage("Enter the Invalid Username : ");
            userActions.LogConsoleMessage("Enter the Invalid password : ");
            userActions.LogConsoleMessage("Click Sign in button");

            Actor.AttemptsTo(LoginUser.For(userActions.InvalidUser!, userActions.InvalidPassword!));

            userActions.LogConsoleMessage("Verify : Error message is displayed ");
            Actor.WaitsUntil(Text.Of(LoginPage.ErrorMessageLocator), ContainsSubstring.Text(LoginPage.UnableToLoginError));

            userActions.LogConsoleMessage("Clean up :");

        }

    }
}
