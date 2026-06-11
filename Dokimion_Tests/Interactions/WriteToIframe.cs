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

            // Enter editor text via TinyMCE's own setContent API. This is the one place we
            // can't drive as a user: real keyboard input (element.SendKeys / Actions.SendKeys)
            // into the contenteditable iframe body does not register with TinyMCE through
            // WebDriver, so the step saved empty. Everything else in these tests is still driven
            // by real clicks/hover/menus. Target the Nth editor by its content iframe
            // (title='Rich Text Area'); TinyMCE names that iframe "<editorId>_ifr" and the
            // `tinymce` global lives on the main window, so no frame switch is needed.
            var editorFrames = driver.FindElements(By.XPath("//iframe[@title='Rich Text Area']"));
            string iframeId = editorFrames[this.FrameNum].GetAttribute("id");
            string editorId = iframeId.EndsWith("_ifr")
                ? iframeId.Substring(0, iframeId.Length - "_ifr".Length)
                : iframeId;

            userActions.LogConsoleMessage("Set data in the editor: " + Data);
            ((IJavaScriptExecutor)driver).ExecuteScript(
                "var ed = window.tinymce.get(arguments[0]); ed.setContent(arguments[1]); ed.fire('change');",
                editorId, Data);
        }

    }
}
