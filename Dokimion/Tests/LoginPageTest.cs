using Dokimion.Interactions;
using Dokimion.Pages;
using Boa.Constrictor.Screenplay;
using Boa.Constrictor.Selenium;
using OpenQA.Selenium.Chrome;

namespace Dokimion.Tests
{
    internal class LoginPageTest
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
            userActions.LogConsoleMessage("Enter the password : ");
            userActions.LogConsoleMessage("Click Sign in button");

            Actor.AttemptsTo(Clear.On(LoginPage.NameInput));
            Actor.AttemptsTo(SendKeys.To(LoginPage.NameInput, userActions.Username));
            Actor.AttemptsTo(Clear.On(LoginPage.PasswordInput));
            Actor.AttemptsTo(SendKeys.To(LoginPage.PasswordInput, userActions.Password));
            Actor.AttemptsTo(Click.On(LoginPage.SingInButton));


            try
            {
                userActions.LogConsoleMessage("Verify : Username is on top right menu");
                Actor.AttemptsTo(Refresh.Browser());
                Actor.WaitsUntil(Text.Of(Header.UserInfo), ContainsSubstring.Text(userActions.DisplayUserName));

            }
            finally
            {
                userActions.LogConsoleMessage("Clean up : Logout User");
                Actor.AttemptsTo(Refresh.Browser());
                Actor.AttemptsTo(Logout.For());
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
