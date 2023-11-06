using Boa.Constrictor.Screenplay;
using OpenQA.Selenium;
using OpenQA.Selenium.Interactions;

namespace Dokimion.Interactions
{
    internal class WriteToIframe : ITask
    {

        public IWebDriver driver;
        public int FrameNum { get; }
        public string Data { get; }

        private WriteToIframe(IWebDriver driver, int frameNum, string data)
        {
         
            this.driver = driver;
            this.FrameNum = frameNum;
            this.Data = data;
        }

        public static WriteToIframe For(IWebDriver driver, int frameNum, string data) =>
          new WriteToIframe(driver,frameNum,data);


        public void PerformAs(IActor actor)
        {
            UserActions userActions = new UserActions();
            
            driver.SwitchTo().Frame(this.FrameNum);
            //Wait as its dynamic
            Actions actions = new Actions(driver);
            actions.Pause(TimeSpan.FromSeconds(1)).Build().Perform();

            IWebElement expectationContent = driver.FindElement(By.TagName("p"));
            userActions.LogConsoleMessage("Enter data in the editor");
            expectationContent.SendKeys(Data);

            driver.SwitchTo().DefaultContent();

        }

    }
}
