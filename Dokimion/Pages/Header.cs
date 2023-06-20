using Boa.Constrictor.Selenium;
using OpenQA.Selenium;
using static Boa.Constrictor.Selenium.WebLocator;



namespace Dokimion.Pages
{
    public class Header
    {
        public static IWebLocator UserInfo => L(
                    "Display User Name",
                    By.XPath("//a[@id = 'bd-login']"));

        public static IWebLocator ProfileLink => L("Profile Link", By.XPath("//a[contains(text(),'Profile')]"));

        public static IWebLocator LogoutLink => L("Logout Link", By.XPath("//a[contains(text(),'Log out')]"));

        public static IWebLocator ProfileName => L("Profile Name", By.XPath("//h1[contains(text(),'Tester')]"));


        public static IWebLocator ProjectsLink => L("Project Link", By.XPath("//*[@id='bd-projects']"));


        public static IWebLocator AllLink => L("All Link", By.XPath("//a[contains(text(),'All')]"));

        public static IWebLocator TestManagerLink => L("Test Manager Link", By.XPath("//a[contains(text(),'Test Manager')]"));

    }



    //public string xpathProfileLink = "//a[contains(text(),'Profile')]";




    //public string xpathProjectLink = "//*[@id='bd-projects']";

    //public string xpathAllLink = "//a[contains(text(),'All')]";

    //public string xpathTestManager = "//a[contains(text(),'Test Manager')]";

    //public string xpathLogout = "//a[contains(text(),'Log out')]";



}
