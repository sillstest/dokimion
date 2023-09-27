using Dokimion.Interactions;
using Dokimion.Pages;
using Boa.Constrictor.Screenplay;
using Boa.Constrictor.Selenium;
using OpenQA.Selenium.Chrome;
using FluentAssertions;
using OpenQA.Selenium;
using OpenQA.Selenium.Interactions;
using WebDriverManager;
using WebDriverManager.DriverConfigs.Impl;
using WebDriverManager.Helpers;

namespace Dokimion.Tests
{
    internal class HeaderUserAccessTests
    {
        private IActor Actor;
        UserActions userActions;
        Actions actions;
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
            actions = new Actions(driver);


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
                //Open Dokimion again 
                Actor.AttemptsTo(Wait.Until(Appearance.Of(LoginPage.NameInput), IsEqualTo.True()).ForAnAdditional(15));
                count++;
                userActions.LogConsoleMessage("Unable to load page : retried with addtionatime on " + count + " " + ex.ToString());
            }

            Actor.WaitsUntil(Appearance.Of(LoginPage.LoginPageWelcomeMsg), IsEqualTo.True());
            var welcomeMessage = Actor.AskingFor(Text.Of(LoginPage.LoginPageWelcomeMsg));
            userActions.LogConsoleMessage("Login Page is loaded successfully on count " + count + " " + welcomeMessage);

        }
        [TearDown]
        public void TearDownAfterTestCase()
        {
            userActions.TearDownAfterTestcase();
        }


        [OneTimeTearDown]
        public void QuitBrowser()
        {
            Actor.AttemptsTo(QuitWebDriver.ForBrowser());
        }

        [Test]
        public void TC3UserOptions()
        {
            userActions.LogConsoleMessage(TestContext.CurrentContext.Test.MethodName!);
            userActions.LogConsoleMessage("Set Up : ");
            userActions.LogConsoleMessage("Login as User");

            Actor.AttemptsTo(LoginUser.For(userActions.Username!, userActions.Password!));

            try
            {
                userActions.LogConsoleMessage("Action steps : ");
                userActions.LogConsoleMessage("Click on right side on User link");

                var elementAppreared = Actor.AsksFor(Appearance.Of(Header.UserInfo));
                if (!elementAppreared)
                {
                    Actor.AttemptsTo(Wait.Until(Appearance.Of(Header.UserInfo), IsEqualTo.True()).ForAnAdditional(15));

                }
                Actor.AttemptsTo(Click.On(Header.UserInfo));
                userActions.LogConsoleMessage("Verify : Profile and Logout links displayed");
                Actor.WaitsUntil(Text.Of(Header.ProfileLink), IsEqualTo.Value(Header.Profile)).Should().NotBeNullOrEmpty();
                Actor.WaitsUntil(Text.Of(Header.LogoutLink), IsEqualTo.Value(Header.Logout)).Should().NotBeNullOrEmpty();

            }
            finally
            {
                userActions.LogConsoleMessage("Clean up : Logout User");
                var elementAppreared = Actor.AsksFor(Appearance.Of(Header.UserInfo));
                if (!elementAppreared)
                {
                    Actor.AttemptsTo(Wait.Until(Appearance.Of(Header.UserInfo), IsEqualTo.True()).ForAnAdditional(15));

                }
            
                actions.ClickAndHold(Header.UserInfo.FindElement(driver));
                actions.SendKeys(Keys.Down + Keys.Down);
                actions.Build();
                actions.Perform();
                actions.Click(Header.LogoutLink.FindElement(driver)).Perform();
            
            }
        }


        [Test]
        public void TC4UserClickOnProfile()
        {
            userActions.LogConsoleMessage(TestContext.CurrentContext.Test.MethodName!);
            userActions.LogConsoleMessage("Set Up : ");
            userActions.LogConsoleMessage("Login as User");
            Actor.AttemptsTo(LoginUser.For(userActions.Username!, userActions.Password!));

            try
            {
                userActions.LogConsoleMessage("Action steps : ");
                userActions.LogConsoleMessage("Click on right side on User link");
                var elementAppreared=  Actor.AsksFor(Appearance.Of(Header.UserInfo));
                if (!elementAppreared)
                {
                    userActions.LogConsoleMessage("Wait till user name is displayed");
                    Actor.AttemptsTo(Wait.Until(Appearance.Of(Header.UserInfo), IsEqualTo.True()).ForAnAdditional(15));

                }
                Actor.AttemptsTo(Click.On(Header.UserInfo));
                userActions.LogConsoleMessage("Click on Profile link");
                Actor.AttemptsTo(Click.On(Header.ProfileLink));

                userActions.LogConsoleMessage("Verify : User name is displayed");
                Actor.WaitsUntil(Text.Of(Header.ProfileName), ContainsSubstring.Text(userActions.DisplayUserName));
            }
            finally
            {
                userActions.LogConsoleMessage("Clean up : Logout User");
                var elementAppreared = Actor.AsksFor(Appearance.Of(Header.UserInfo));
                if (!elementAppreared)
                {
                    userActions.LogConsoleMessage("Wait till user name is displayed");
                    Actor.AttemptsTo(Wait.Until(Appearance.Of(Header.UserInfo), IsEqualTo.True()).ForAnAdditional(15));

                }
                Actor.AttemptsTo(Logout.For());
            }
        }


        [Test]
        public void TC5UserClickOnProjects()
        {
            userActions.LogConsoleMessage(TestContext.CurrentContext.Test.MethodName!);
            userActions.LogConsoleMessage("Set Up : ");
            userActions.LogConsoleMessage("Login as User");
            Actor.AttemptsTo(LoginUser.For(userActions.Username!, userActions.Password!));

            try
            {
                userActions.LogConsoleMessage("Action steps : ");
                userActions.LogConsoleMessage("Click on left side Projects link");
                actions.Pause(TimeSpan.FromSeconds(1)).Perform();
                IWebElement projectLink = Header.ProjectsLink.FindElement((IWebDriver)driver);
                actions.Click(projectLink).Perform();
                //permission granted only for this project for user (Tester & User : Roopa)
                userActions.LogConsoleMessage("Verify : All and Dokimion project links are in dropdown");
                bool allExists = Actor.AskingFor(Appearance.Of(Header.AllLink));
                bool dokimionExists = Actor.AskingFor(Appearance.Of(Header.Dokimion));
                Assert.That((allExists && dokimionExists), Is.True);
            }
            finally
            {
                userActions.LogConsoleMessage("Clean up : Logout User");
       
                var elementAppreared = Actor.AsksFor(Appearance.Of(Header.UserInfo));
                if (!elementAppreared)
                {
                    userActions.LogConsoleMessage("Wait till user name is displayed");
                    Actor.AttemptsTo(Wait.Until(Appearance.Of(Header.UserInfo), IsEqualTo.True()).ForAnAdditional(15));

                }
                Actor.AttemptsTo(Logout.For());
            }
        }


        [Test]
        public void TC6UserClickOnLogout()
        {
            userActions.LogConsoleMessage(TestContext.CurrentContext.Test.MethodName!);
            userActions.LogConsoleMessage("Set Up : ");
            userActions.LogConsoleMessage("Login as User");
            Actor.AttemptsTo(LoginUser.For(userActions.Username!, userActions.Password!));


            userActions.LogConsoleMessage("Action steps : ");
            userActions.LogConsoleMessage("Click on right side on User link");
            var elementAppreared = Actor.AsksFor(Appearance.Of(Header.UserInfo));
            if (!elementAppreared)
            {
                Actor.AttemptsTo(Wait.Until(Appearance.Of(Header.UserInfo), IsEqualTo.True()).ForAnAdditional(15));
            }
            Actor.AttemptsTo(Click.On(Header.UserInfo));

            userActions.LogConsoleMessage("Click on Logout link");
            Actor.AttemptsTo(Click.On(Header.LogoutLink));

            userActions.LogConsoleMessage("Verify : User logged out");
            Actor.WaitsUntil(Text.Of(LoginPage.LoginPageWelcomeMsg), IsEqualTo.Value("Please sign in"));

            userActions.LogConsoleMessage("Clean up :");

        }

    }
}
