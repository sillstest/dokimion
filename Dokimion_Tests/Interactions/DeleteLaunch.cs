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
            Actor.AttemptsTo(Click.On(Header.Launches));

            Actions actions = new Actions(driver);
            By trashIcon = By.XPath("//tr//button//i[@class='bi-trash']");

            // Let the launch table load — it may legitimately be empty when this is used as a
            // pre-test purge, so we can't wait for a launch row to appear.
            System.Threading.Thread.Sleep(3000);

            // Delete launches one at a time until none remain. The table re-renders after each delete,
            // so RE-QUERY every pass (a cached element list goes stale) and WAIT for the row count to
            // drop before the next delete. The original tight click-loop with no waits left launches
            // behind under React re-renders, which then skewed the statistics/filter tests (TC22/TC23).
            // The transient "Node ... does not belong to the document" detach error is tolerated.
            for (int guard = 0; guard < 50; guard++)
            {
                int before;
                try { before = driver.FindElements(trashIcon).Count; }
                catch (WebDriverException) { System.Threading.Thread.Sleep(500); continue; }

                if (before == 0) break;   // all launches deleted (or none to begin with)

                try
                {
                    IWebElement first = driver.FindElements(trashIcon)[0];
                    actions.MoveToElement(first).Click(first).Build().Perform();
                }
                catch (WebDriverException) { continue; }   // stale mid-render -> re-query next pass

                // Wait (up to ~15s) for the delete to commit and the table to re-render (count drops).
                for (int w = 0; w < 30; w++)
                {
                    System.Threading.Thread.Sleep(500);
                    int now;
                    try { now = driver.FindElements(trashIcon).Count; }
                    catch (WebDriverException) { now = before; }
                    if (now < before) break;
                }
            }

            actions.Release().Build().Perform();
        }



    }
}
