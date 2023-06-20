using Dokimion.Interactions;
using Dokimion.Pages;
using Boa.Constrictor.Screenplay;
using Boa.Constrictor.Selenium;
using OpenQA.Selenium.Chrome;

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
            userActions.LogConsoleMessage("Register Driver & Open the QuAck website");

            Actor = new Actor(name: userActions.ActorName, logger: new NoOpLogger());
            Actor.Can(BrowseTheWeb.With(new ChromeDriver(userActions.GetChromeOptions())));
            Actor.AttemptsTo(Navigate.ToUrl(userActions.QuackUrl));

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
                userActions.LogConsoleMessage("Click on left side on User link");
                Actor.AttemptsTo(Click.On(Header.UserInfo));

                userActions.LogConsoleMessage("Verify : Profile and Logout links displayed");
                bool profileExists = Actor.AskingFor(Existence.Of(Header.ProfileLink));
                bool logoutExists = Actor.AskingFor(Existence.Of(Header.LogoutLink));

                Assert.That((profileExists && logoutExists), Is.True);
                
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
                userActions.LogConsoleMessage("Click on left side on User link");
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
                userActions.LogConsoleMessage("Click on right side Projects link");
                Actor.AttemptsTo(Click.On(Header.ProjectsLink));

                //permission granted only for this project for user (Tester & User : Roopa)
                userActions.LogConsoleMessage("Verify : All and Test Manager project links are in dropdown");
                bool allExists = Actor.AskingFor(Appearance.Of(Header.AllLink));
                bool testManagerExists = Actor.AskingFor(Appearance.Of(Header.TestManagerLink));
                Assert.That((allExists && testManagerExists), Is.True);
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
            userActions.LogConsoleMessage("Click on left side on User link");
            Actor.AttemptsTo(Click.On(Header.UserInfo));

            userActions.LogConsoleMessage("Click on Logout link");
            Actor.AttemptsTo(Click.On(Header.LogoutLink));

            userActions.LogConsoleMessage("Verify : User logged out");
            Actor.WaitsUntil(Text.Of(LoginPage.LoginPageWelcomeMsg), IsEqualTo.Value("Please sign in"));

            userActions.LogConsoleMessage("Clean up :");

        }

    }
}
