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

            // Set the content via TinyMCE's JS API rather than SendKeys. SendKeys into the
            // editor iframe does not reliably enter text (confirmed: correct iframe + valid
            // editor ref, yet getContent() reads back ""), so the step saved empty.
            //
            // Target the Nth editor by its content iframe (title='Rich Text Area'); TinyMCE
            // names that iframe "<editorId>_ifr", and the `tinymce` global lives on the main
            // window, so we resolve the editor and setContent() without switching frames.
            // Give TinyMCE a moment to finish initialising (register the editor) — the editor
            // form has just been added/rendered.
            new Actions(driver).Pause(TimeSpan.FromSeconds(1)).Build().Perform();

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
