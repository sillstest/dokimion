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

            // Deleting a test case triggers a full page reload to the test-case list (the detail
            // view, and its Remove button, disappear). Wait for that reload to fully land before
            // returning — otherwise it bleeds into the next test, where the project nav re-renders
            // mid-step and a click on it races a NoSuchElement. After the detail is gone, wait for
            // the project nav (restored by TestCases' onProjectChange) so the next test is stable.
            userActions.LogConsoleMessage("Wait for the delete reload to settle");
            // Use Count (FindElements) rather than Appearance (get_Displayed) here: during the delete
            // reload the Remove button's node is being detached, and calling get_Displayed on a node
            // mid-detach throws "Node ... does not belong to the document" (a -32000 WebDriverException
            // Boa does not retry). Counting matches never touches get_Displayed, so a gone/detaching
            // element simply counts as 0.
            Actor.WaitsUntil(Count.Of(TestCases.RemoveTestCase), IsEqualTo.Value(0), timeout: 60);
            Actor.WaitsUntil(Appearance.Of(Header.TestCases), IsEqualTo.True(), timeout: 60);
        }

    }
}
