using Boa.Constrictor.Selenium;
using OpenQA.Selenium;
using static Boa.Constrictor.Selenium.WebLocator;



namespace Dokimion.Pages
{
    public class Header
    {
        public static IWebLocator UserInfo => L(
                    "UserNameOnHeader",
                    By.XPath("//a[@id = 'bd-login']"));

        public static IWebLocator ProfileLink => L("Profile Link", By.XPath("//a[contains(text(),'Profile')]"));

        public static IWebLocator LogoutLink => L("Logout Link", By.XPath("//a[contains(text(),'Log out')]"));

        public static IWebLocator ProfileName => L("Profile Name", By.XPath("//a[contains(text(),'Tester')]"));


        public static IWebLocator ProjectsLink => L("Project Link", By.XPath("//a[@id='bd-projects']"));


        public static IWebLocator AllLink => L("All Link", By.XPath("//a[contains(text(),'All')]"));

        public static IWebLocator Dokimion => L("Dokimion", By.XPath("//a[contains(text(),'Dokimion')]"));

        public static string Profile = "Profile";
        public static string Logout = "Log out";

        public static IWebLocator TestCases => L("TestCases", By.XPath("//a[normalize-space()='TestCases']"));
        //div[@class='card-header']//a[normalize-space()='Dokimion']
        public static IWebLocator DokimionProject => L("DokimionProject", By.XPath("//div[@class='card-header']//a[normalize-space()='Dokimion']"));

        public static IWebLocator Attributes => L("TestCases", By.XPath("//a[normalize-space()='Attributes']"));


    }

}
