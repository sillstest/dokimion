using Boa.Constrictor.Screenplay;
using Boa.Constrictor.Selenium;
using Dokimion.Pages;
using OpenQA.Selenium;
using OpenQA.Selenium.Interactions;
using System.Collections.ObjectModel;

namespace Dokimion.Tests
{
    internal class CreationAndFilterHelpers
    {
        
        UserActions userActions = new UserActions();
        public void CreateSmokeTest(IActor Actor, IWebDriver driver)
        {
            //create a group with Functionality and Priority high
            CreateSmokeTestFilter(Actor, driver);

            userActions.LogConsoleMessage("Click on the Launch button on the right");
            Actor.AttemptsTo(Click.On(TestCases.LaunchSaveButton));

            userActions.LogConsoleMessage("Enter Smoke Test Launch in the input");
            Actor.WaitsUntil(Appearance.Of(TestCases.LaunchNameInput), IsEqualTo.True(), timeout: 60);
            Actor.AttemptsTo(Clear.On(TestCases.LaunchNameInput));
            Actor.AttemptsTo(SendKeys.To(TestCases.LaunchNameInput, "Smoke Test Launch"));

            userActions.LogConsoleMessage("Click on the Create Launch Button");
            Actor.AttemptsTo(Click.On(TestCases.LaunchCreateButton));

            userActions.LogConsoleMessage("Click on the Go To Launch link");
            Actor.WaitsUntil(Appearance.Of(TestCases.GoToLaunchLink), IsEqualTo.True(), timeout: 60);
            Actor.AttemptsTo(Click.On(TestCases.GoToLaunchLink));


            Actor.WaitsUntil(TextList.For(TestCases.TestCaseTreeListMain), IsAnEnumerable<string>.WhereTheCount(IsEqualTo.Value(4)), timeout: 60);
            ReadOnlyCollection<IWebElement> Filtered_TestCase = TestCases.TestCaseTreeListMain.FindElements(driver);
            Assert.That(Filtered_TestCase.Count, Is.EqualTo(4));

            userActions.LogConsoleMessage("Complete the Launch by updating the Testcase status");
            userActions.LogConsoleMessage("Click on the Add testcase TC");
            string locator1 = "//li[contains(@data-id,'TestCase')]//i[contains(@class,'gj-icon')]";
            driver.FindElement(By.XPath(locator1)).Click();
            Actor.AttemptsTo(Click.On(TestCases.AddTestcaseLocator));
            UpdateLaunchStatusControl(Actor,TestCases.LaunchPassButton, "No Comments", driver);

            userActions.LogConsoleMessage("Click on the Launch creation TC");
            string locator2 = "//li[contains(@data-id,'Launch')]//i[contains(@class,'gj-icon')]";
            driver.FindElement(By.XPath(locator2)).Click();
            Actor.AttemptsTo(Click.On(TestCases.LaunchCreationTC));
            UpdateLaunchStatusControl(Actor,TestCases.LaunchBrokenButton, "Broken",driver);

            userActions.LogConsoleMessage("Click on the Header Project List Validation TC");
            string locator3 = "//li[contains(@data-id,'Projects')]//i[contains(@class,'gj-icon')]";
            driver.FindElement(By.XPath(locator3)).Click();
            Actor.AttemptsTo(Click.On(TestCases.HeaderProjectListGroupTC));
            UpdateLaunchStatusControl(Actor,TestCases.LaunchFailButton, "Something Went wrong", driver);

            userActions.LogConsoleMessage("Click on the Validate login TC");
            string locator4 = $"(//li[contains(@data-id,'Authentication')]//i[contains(@class,'gj-icon')])[1]";
            driver.FindElement(By.XPath(locator4)).Click();
            Actor.AttemptsTo(Click.On(TestCases.ValidateLoginGroupTC));
            UpdateLaunchStatusControl(Actor, TestCases.LaunchPassButton, "No Comments", driver);

        }
        public void CreateSmokeTestFilter(IActor Actor, IWebDriver driver)
        {
            //create a group with Functionality and Priority high
            userActions.LogConsoleMessage("Click on the Testcases on header");
            Actor.AttemptsTo(Click.On(Header.TestCases));

            userActions.LogConsoleMessage("Click on the Grouping Select Input");
            Actor.AttemptsTo(Click.On(TestCases.GroupingSelect));
            //From the drop down 
            userActions.LogConsoleMessage("Select from dropdown: Functionality ");


            //for now loop 3 times - no of attributes
            ReadOnlyCollection<IWebElement> listOfAttributes = TestCases.GroupingDropDown.FindElements(driver);
            List<IWebElement> list = listOfAttributes.ToList();
            IWebElement element = list.ElementAt(0);
            element.Click();

            userActions.LogConsoleMessage("Click on the Filter Select Input");
            

            Actor.AttemptsTo(Click.On(TestCases.Filter1Locator));
            userActions.LogConsoleMessage("Select Priority from the dropdown");

            Actor.AttemptsTo(Click.On(TestCases.Filter1AttributeLocator));

            Actor.AttemptsTo(Click.On(TestCases.Filter1Selector));

            userActions.LogConsoleMessage("Select High from the dropdown");

            Actor.AttemptsTo(Click.On(TestCases.Filter1AttribValue));

            userActions.LogConsoleMessage("Click on the Filter Button");

            Actor.AttemptsTo(Click.On(TestCases.FilterLocator));
        }
        public void CreateSmokeTestReRun(IActor Actor, IWebDriver driver)
        {
            CreateSmokeTest(Actor, driver);

            userActions.LogConsoleMessage("Click on the Launches on Header");

            Actor.AttemptsTo(Click.On(Header.Launches));
            //
            userActions.LogConsoleMessage("Click on the Smoke Test Launch link");

            Actor.AttemptsTo(Click.On(Launches.SmokeTestLink));

            userActions.LogConsoleMessage("Click on the Restart Failed");
            Actions actions = new Actions(driver);
            IWebElement RestartFailButton = TestCases.LaunchRestartFailButton.FindElement(driver);
            actions.MoveToElement(RestartFailButton).Click(RestartFailButton).
                Build().Perform();

            userActions.LogConsoleMessage("Enter Smoke Test Launch Re-Run on Name Input");

            Actor.WaitsUntil(Appearance.Of(TestCases.LaunchRestartNameInput), IsEqualTo.True(), timeout: 60);
            Actor.AttemptsTo(Clear.On(TestCases.LaunchRestartNameInput));
            Actor.AttemptsTo(SendKeys.To(TestCases.LaunchRestartNameInput, "Smoke Test Launch Re-Run"));
            Actor.AttemptsTo(Click.On(TestCases.LaunchRestartCreateButton));

            userActions.LogConsoleMessage("Click on the Go To Launch on Restart");


            Actor.AttemptsTo(Click.On(TestCases.LaunchRestartGoToLaunch));
            Actor.WaitsUntil(Appearance.Of(TestCases.LaunchRestartModal), IsEqualTo.True(), timeout: 60);

            userActions.LogConsoleMessage("Click on the Close button Restart");

            Actor.AttemptsTo(Click.On(TestCases.LaunchRestartCloseButton));

            userActions.LogConsoleMessage("Click on the Launches on header");

            //Go to Main Header
            Actor.AttemptsTo(Click.On(Header.Launches));

            userActions.LogConsoleMessage("Click on the Smoke Test Launch Re-Run link on Launches");
            Actor.WaitsUntil(Appearance.Of(Launches.SmokeTestReRunLink), IsEqualTo.True(), timeout: 60);
            Actor.AttemptsTo(Hover.Over(Launches.SmokeTestReRunLink));
            Actor.AttemptsTo(Click.On(Launches.SmokeTestReRunLink));

            //
            string locator3 = "//li[contains(@data-id,'Projects')]//i[contains(@class,'gj-icon')]";
            Actor.WaitsUntil(Appearance.Of(new WebLocator("locator3", By.XPath(locator3))), IsEqualTo.True(), timeout: 60);
            Actor.AttemptsTo(Click.On(new WebLocator("locator3", By.XPath(locator3))));

            userActions.LogConsoleMessage("Update the status on Header Project List Validation");

            Actor.AttemptsTo(Click.On(TestCases.HeaderProjectListGroupTC));
            UpdateLaunchStatusControl(Actor, TestCases.LaunchPassButton, "", driver);
        }


        public void CreateTCLaunches(IActor Actor, IWebDriver driver)
        {
     
            userActions.LogConsoleMessage("Click on Testcases on header");

            Actor.AttemptsTo(Click.On(Header.TestCases));
            //
            Actions actions = new Actions(driver);

            Actor.WaitsUntil(TextList.For(TestCases.TestCaseTreeListMain), IsAnEnumerable<string>.WhereTheCount(IsGreaterThan.Value(1)), timeout: 60);
            ReadOnlyCollection<IWebElement> testcases = TestCases.TestCaseTreeListMain.FindElements(driver);

            foreach (IWebElement testcase in testcases)
            {
                var testcasename = testcase.Text;

                if (testcasename.Contains("Project update") || testcasename.Contains("Project delete")
                    || testcasename.Contains("Delete testcase") || testcasename.Contains("Group testcase")
                    || testcasename.Contains("Test suites list") || testcasename.Contains("Statistics"))
                {
                    userActions.LogConsoleMessage($"Uncheck the {testcasename}");

                    IWebElement SpanCheckBox = testcase.FindElement(By.XPath("descendant::span[@data-role='checkbox']"));
                    actions.MoveToElement(SpanCheckBox).Click(SpanCheckBox).Build().Perform();

                }
            }
            userActions.LogConsoleMessage($"Click on the Save button");
            Actor.AttemptsTo(Click.On(TestCases.LaunchSaveButton));

            Actor.WaitsUntil(Appearance.Of(TestCases.LaunchNameInput), IsEqualTo.True(), timeout: 60);
            userActions.LogConsoleMessage("Enter Launch Testcases in the input");
            Actor.AttemptsTo(Clear.On(TestCases.LaunchNameInput));
            Actor.AttemptsTo(SendKeys.To(TestCases.LaunchNameInput, "Launch Testcases"));


            userActions.LogConsoleMessage("Click on the Create Launch Button");
            Actor.AttemptsTo(Click.On(TestCases.LaunchCreateButton));
            Actor.WaitsUntil(Appearance.Of(TestCases.GoToLaunchLink), IsEqualTo.True(), timeout: 60);

            userActions.LogConsoleMessage("Click on the Go To Launch link");
            Actor.AttemptsTo(Click.On(TestCases.GoToLaunchLink));

            //for all TC update status to pass
            userActions.LogConsoleMessage("Update the status to pass on all testcases");

            Actor.WaitsUntil(TextList.For(TestCases.TestCaseTreeListMain), IsAnEnumerable<string>.WhereTheCount(IsEqualTo.Value(11)), timeout: 60);
            ReadOnlyCollection<IWebElement> Filtered_TestCase1 = TestCases.TestCaseTreeListMain.FindElements(driver);
            foreach (IWebElement tc in Filtered_TestCase1)
            {
                userActions.LogConsoleMessage("Update the status on" + tc.Text);

                actions.MoveToElement(tc).Click(tc).Build().Perform();
                UpdateLaunchStatusControl(Actor,TestCases.LaunchPassButton, "", driver);
            }
        }

        private void UpdateLaunchStatusControl(IActor Actor, IWebLocator Status, string comments, IWebDriver driver)
        {

            Actions actions = new Actions(driver);
            //Scroll the main div
            actions.SendKeys(Keys.PageDown).Pause(TimeSpan.FromSeconds(1)).Build().Perform();
            //Activate the div
            IWebElement TestcaseDiv = driver.FindElement(By.XPath("//div[@id='testCase']"));
            actions.MoveToElement(TestcaseDiv).Build().Perform();
            driver.SwitchTo().ActiveElement().Click();
            //This will scroll to the bottom in inside test case
            actions.SendKeys(Keys.PageDown).Pause(TimeSpan.FromSeconds(1)).Build().Perform();
            actions.Release().Build().Perform();

            userActions.LogConsoleMessage("Click on the Start Button");
            Actor.AttemptsTo(Click.On(TestCases.LaunchStartButton));

            string description = Status.Description;
            if (description.Contains("Pass"))
            {
                userActions.LogConsoleMessage("Click on the Pass Button");
                //Pass no need for comments
                Actor.AttemptsTo(Click.On(Status));
                Actor.WaitsUntil(Appearance.Of(TestCases.LaunchPassStatusButton), IsEqualTo.True(), timeout: 45);

            }
            else if (description.Contains("Fail"))
            {
                userActions.LogConsoleMessage("Click on the Fail Button");
                Actor.AttemptsTo(Click.On(Status));
                Actor.WaitsUntil(Appearance.Of(TestCases.LaunchFailMessage), IsEqualTo.True(), timeout: 45);

                userActions.LogConsoleMessage("Enter the Reason for Fail " + comments);
                Actor.AttemptsTo(Clear.On(TestCases.LaunchFailMessage));
                Actor.AttemptsTo(SendKeys.To(TestCases.LaunchFailMessage, comments));

                Actor.WaitsUntil(Text.Of(TestCases.LaunchFailMessage), ContainsSubstring.Text(comments), timeout: 45);

                userActions.LogConsoleMessage("Click on the Fail Button");
                Actor.AttemptsTo(Hover.Over(TestCases.LaunchFailMsgButton));

                Actor.AttemptsTo(Click.On(TestCases.LaunchFailMsgButton));
                Actor.WaitsUntil(Appearance.Of(TestCases.LaunchFailStatusButton), IsEqualTo.True(), timeout: 45);


            }
            else if (description.Contains("Broken"))
            {
                userActions.LogConsoleMessage("Click on the Broken Button");
                Actor.AttemptsTo(Click.On(Status));

                userActions.LogConsoleMessage("Enter the Reason for Broken " + comments);
                Actor.AttemptsTo(Clear.On(TestCases.LaunchBrokenMessage));
                Actor.AttemptsTo(SendKeys.To(TestCases.LaunchBrokenMessage, comments));
                Actor.WaitsUntil(Text.Of(TestCases.LaunchBrokenMessage), ContainsSubstring.Text(comments), timeout: 45);

                userActions.LogConsoleMessage("Click on the Broken Button");
                Actor.AttemptsTo(Hover.Over(TestCases.LaunchBrokenMsgButton));

                Actor.AttemptsTo(Click.On(TestCases.LaunchBrokenMsgButton));
                Actor.WaitsUntil(Appearance.Of(TestCases.LaunchBrokenStatusButton), IsEqualTo.True(), timeout: 45);

            }
            //else if (description.Contains("Skip"))
            //{
            //    userActions.LogConsoleMessage("Click on the Skip Button");
            //    Actor.AttemptsTo(Click.On(Status));

            //    Actor.WaitsUntil(Appearance.Of(TestCases.LaunchSkipMessage), IsEqualTo.True(), timeout: 45);
            //    userActions.LogConsoleMessage("Enter the Reason for Skip " + comments);
            //    Actor.AttemptsTo(Clear.On(TestCases.LaunchSkipMessage));
            //    Actor.AttemptsTo(SendKeys.To(TestCases.LaunchSkipMessage, comments));
            //    Actor.WaitsUntil(Text.Of(TestCases.LaunchSkipMessage), ContainsSubstring.Text(comments), timeout: 45);
            //    //Actor.WaitsUntil(ValueAttribute.Of(TestCases.LaunchSkipMessage), ContainsSubstring.Text(comments), timeout: 45);


            //    userActions.LogConsoleMessage("Click on the Skip Button");
            //    Actor.AttemptsTo(Hover.Over(TestCases.LaunchSkipMsgButton));
            //     TestCases.LaunchSkipMsgButton.FindElement(driver).Click();
            //    Actor.WaitsUntil(Appearance.Of(TestCases.LaunchSkippedStatusButton), IsEqualTo.True(), timeout: 45);

            //}
        }

    }
}
