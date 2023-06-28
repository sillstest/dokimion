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
            userActions.LogConsoleMessage("Register Driver & Open the Dokimion website");

            Actor = new Actor(name: userActions.ActorName, logger: new NoOpLogger());
            ChromeDriver driver = new ChromeDriver(userActions.GetChromeOptions());
            driver.Manage().Window.Maximize();
            driver.SwitchTo().DefaultContent();
            driver.SwitchTo().ActiveElement();

            Actor.Can(BrowseTheWeb.With(driver));
            Actor.AttemptsTo(Navigate.ToUrl(userActions.DokimionUrl));

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
            Actor.AttemptsTo(Click.On(LoginPage.SingInButton));


            try
            {
                userActions.LogConsoleMessage("Verify : Username is on top right menu");
                Actor.AttemptsTo(Refresh.Browser());
                Actor.WaitsUntil(Text.Of(Header.UserInfo),ContainsSubstring.Text(userActions.DisplayUserName), 
                    timeout:60) ;

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
