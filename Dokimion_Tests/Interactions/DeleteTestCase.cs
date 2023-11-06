using Boa.Constrictor.Screenplay;
using Boa.Constrictor.Selenium;
using Dokimion.Pages;
using OpenQA.Selenium;
using OpenQA.Selenium.Interactions;

namespace Dokimion.Interactions
{
    internal class DeleteTestCase : ITask
    {

        private IWebDriver driver;

        private DeleteTestCase(IWebDriver driver)
        {
            this.driver = driver;
        }

        public static DeleteTestCase For(IWebDriver driver) => new DeleteTestCase(driver);

        public void PerformAs(IActor Actor)
        {
            UserActions userActions = new UserActions();
            userActions.LogConsoleMessage("Click on the Remove Testcase button");

            Actions actions = new Actions(driver);
            userActions.LogConsoleMessage("Entered here to scroll with Hover");
            //scoll to the bottom
            actions.SendKeys(Keys.PageDown).Pause(TimeSpan.FromSeconds(1)).Build().Perform();

            Actor.WaitsUntil(Appearance.Of(TestCases.RemoveTestCase), IsEqualTo.True(), timeout: 60);
            Actor.AttemptsTo(Click.On(TestCases.RemoveTestCase));


            userActions.LogConsoleMessage("Click on the Remove Testcase button on confirmation box");
            Actor.WaitsUntil(Appearance.Of(TestCases.RemoveTestCaseButton), IsEqualTo.True(), timeout: 45);
            Actor.AttemptsTo(Hover.Over(TestCases.RemoveTestCaseButton));
            Actor.AttemptsTo(Click.On(TestCases.RemoveTestCaseButton));

        }

    }
}
