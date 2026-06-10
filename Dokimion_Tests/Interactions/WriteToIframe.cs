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

            // Switch to the Nth TinyMCE editor iframe specifically (its content iframe has
            // title='Rich Text Area'), not the Nth iframe overall. Indexing over all iframes
            // is fragile: any other/extra iframe shifts the index, so the keystrokes miss the
            // editor and bubble to the page — where the just-clicked, still-focused "Add Step"
            // button gets activated once per Space in the text, adding a pile of blank steps.
            var editorFrames = driver.FindElements(By.XPath("//iframe[@title='Rich Text Area']"));
            driver.SwitchTo().Frame(editorFrames[this.FrameNum]);
            //Wait as its dynamic
            Actions actions = new Actions(driver);
            actions.Pause(TimeSpan.FromSeconds(1)).Build().Perform();

            IWebElement expectationContent = driver.FindElement(By.TagName("body"));
            userActions.LogConsoleMessage("Enter data in the editor");
            expectationContent.SendKeys(Data);

            driver.SwitchTo().DefaultContent();

        }

    }
}
