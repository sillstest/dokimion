using Dokimion.Pages;
using Boa.Constrictor.Screenplay;
using Boa.Constrictor.Selenium;
using OpenQA.Selenium;

namespace Dokimion.Interactions
{
    internal class Logout : ITask
    {

        private Logout() { }

        public static Logout For() => new Logout();

        public void PerformAs(IActor actor)
        {
            IWebDriver driver = BrowseTheWeb.As(actor).WebDriver;

            actor.WaitsUntil(Appearance.Of(Header.UserInfo), IsEqualTo.True(), timeout:60);
            actor.AttemptsTo(Click.On(Header.UserInfo));

            // The user menu is a Bootstrap dropdown; under a Selenium click it doesn't reliably
            // open, so "Log out" stays hidden and Appearance/Click time out. The link is in the
            // DOM regardless — click it directly via JS, which fires its React onClick (logOut)
            // and performs the logout no matter the dropdown's visual state.
            actor.WaitsUntil(Existence.Of(Header.LogoutLink), IsEqualTo.True(), timeout: 60);
            IWebElement logoutLink = Header.LogoutLink.FindElement(driver);
            ((IJavaScriptExecutor)driver).ExecuteScript("arguments[0].click();", logoutLink);
        }
    }
}
