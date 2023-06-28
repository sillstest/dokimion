using Dokimion.Interactions;
using Dokimion.Pages;
using Boa.Constrictor.Screenplay;
using Boa.Constrictor.Selenium;
using OpenQA.Selenium.Chrome;
using FluentAssertions;
using OpenQA.Selenium;

namespace Dokimion.Tests
{
    internal class HeaderUserAccessTests
    {
        private IActor Actor;
        UserActions userActions;

        [OneTimeSetUp]
        public void Setup()
        {

            userActions = new UserActions();
            userActions.LogConsoleMessage("In one time Set up :" + TestContext.CurrentContext.Test.ClassName);
            userActions.LogConsoleMessage("Register Driver & Open the Dokimion website");

            Actor = new Actor(name: userActions.ActorName, logger: new NoOpLogger());
            WebDriver driver = new ChromeDriver(userActions.GetChromeOptions());

            driver.Manage().Timeouts().PageLoad = TimeSpan.FromSeconds(30);

            //driver.Manage().Window.Maximize();
            //driver.SwitchTo().DefaultContent();
            //driver.SwitchTo().ActiveElement();

            try
            {
                Actor.Can(BrowseTheWeb.With(driver));
                Actor.AttemptsTo(Navigate.ToUrl(userActions.DokimionUrl));
            }catch (Exception ex)
            {
                userActions.LogConsoleMessage("Unable to load page : " + ex.ToString());

            }

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
                Actor.AttemptsTo(Click.On(Header.UserInfo));

                userActions.LogConsoleMessage("Verify : Profile and Logout links displayed");
                Actor.WaitsUntil(Text.Of(Header.ProfileLink), IsEqualTo.Value(Header.Profile)).Should().NotBeNullOrEmpty();
                Actor.WaitsUntil(Text.Of(Header.LogoutLink), IsEqualTo.Value(Header.Logout)).Should().NotBeNullOrEmpty();

            }
            finally
            {
                userActions.LogConsoleMessage("Clean up : Logout User");
                Actor.AttemptsTo(Refresh.Browser());
                Actor.AttemptsTo(Logout.For());
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
                Actor.AttemptsTo(Click.On(Header.UserInfo));

                userActions.LogConsoleMessage("Click on Profile link");
                Actor.AttemptsTo(Click.On(Header.ProfileLink));

                userActions.LogConsoleMessage("Verify : User name is displayed");
                Actor.WaitsUntil(Text.Of(Header.ProfileName), ContainsSubstring.Text(userActions.DisplayUserName));
            }
            finally
            {
                userActions.LogConsoleMessage("Clean up : Logout User");
                Actor.AttemptsTo(Refresh.Browser());
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
                Actor.AttemptsTo(Click.On(Header.ProjectsLink));

                //permission granted only for this project for user (Tester & User : Roopa)
                userActions.LogConsoleMessage("Verify : All and Dokimion project links are in dropdown");
                bool allExists = Actor.AskingFor(Appearance.Of(Header.AllLink));
                bool dokimionExists = Actor.AskingFor(Appearance.Of(Header.Dokimion));
                Assert.That((allExists && dokimionExists), Is.True);
            }
            finally
            {
                userActions.LogConsoleMessage("Clean up : Logout User");
                Actor.AttemptsTo(Refresh.Browser());
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
            Actor.AttemptsTo(Click.On(Header.UserInfo));

            userActions.LogConsoleMessage("Click on Logout link");
            Actor.AttemptsTo(Click.On(Header.LogoutLink));

            userActions.LogConsoleMessage("Verify : User logged out");
            Actor.WaitsUntil(Text.Of(LoginPage.LoginPageWelcomeMsg), IsEqualTo.Value("Please sign in"));

            userActions.LogConsoleMessage("Clean up :");

        }

    }
}
