using Boa.Constrictor.Screenplay;
using Boa.Constrictor.Selenium;
using Dokimion.Pages;
using OpenQA.Selenium.Interactions;
using OpenQA.Selenium;
using System;
using System.Collections.Generic;
using System.Collections.ObjectModel;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Dokimion.Interactions {
    internal class DeleteLaunch : ITask

    {
        public IWebDriver driver;

        private DeleteLaunch(IWebDriver driver)
        {
           this.driver = driver;
        }

        public static DeleteLaunch For(IWebDriver driver
            ) => new DeleteLaunch(driver);

        public void PerformAs(IActor Actor)
        {

           // userActions.LogConsoleMessage("Click on the Launches on header");
            Actor.AttemptsTo(Click.On(Header.Launches));

            Actions actions = new Actions(driver);

            Actor.WaitsUntil(Appearance.Of(Launches.LaunchDelete), IsEqualTo.True(), timeout: 60);
            Actor.WaitsUntil(Count.Of(Launches.LaunchDelete), IsGreaterThanOrEqualTo.Value(1), timeout: 60);
            ReadOnlyCollection<IWebElement> launches = Launches.LaunchDelete.FindElements(driver);
            int launchCount = launches.Count;
            if (launchCount != 0)
            {
                for (int i = 1; i <= launchCount; i++)
                {
                    string xpath_delete_icon = $"(//tr//button//i[@class='bi-trash'])[1]";
                    IWebElement launch = driver.FindElement(By.XPath(xpath_delete_icon));
                    actions.MoveToElement(launch).Click(launch).Build().Perform();
                }
            }

            actions.Release().Build().Perform();

        }



    }
}
