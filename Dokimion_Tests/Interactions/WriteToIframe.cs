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

            // Give TinyMCE a moment to finish initialising the just-rendered editor.
            new Actions(driver).Pause(TimeSpan.FromSeconds(1)).Build().Perform();

            // Switch to the Nth TinyMCE editor — its content iframe is the one titled
            // 'Rich Text Area' (indexing over all iframes is fragile). Then click the editable
            // body to place the caret and type, simulating a user entering text. The click to
            // focus is what makes SendKeys land in the editor.
            var editorFrames = driver.FindElements(By.XPath("//iframe[@title='Rich Text Area']"));
            driver.SwitchTo().Frame(editorFrames[this.FrameNum]);

            IWebElement editorBody = driver.FindElement(By.TagName("body"));
            editorBody.Click();
            userActions.LogConsoleMessage("Enter data in the editor: " + Data);
            editorBody.SendKeys(Data);

            driver.SwitchTo().DefaultContent();
        }

    }
}
