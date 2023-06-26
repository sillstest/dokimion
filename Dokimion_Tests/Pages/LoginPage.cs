using Boa.Constrictor.Selenium;
using OpenQA.Selenium;
using static Boa.Constrictor.Selenium.WebLocator;


namespace Dokimion.Pages
{
    public class LoginPage
    {

        public const string UnableToLoginError = "Unable to login";
        
        public static IWebLocator NameInput => L(
          "Quack Login Page : Name",
          By.Id("login"));

        public static IWebLocator PasswordInput => L(
            "Quack Login Page : Password",
            By.Id("password"));

        public static IWebLocator SingInButton => L("Sign In button ", By.XPath("//button[text()='Sign in']"));

        public static IWebLocator ErrorMessageLocator => L("Error Message :", By.XPath("//div[@class='popup-content']"));
        public static IWebLocator LoginPageWelcomeMsg => L("Login Page :", By.TagName("h1"));

    }
}
