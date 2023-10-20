using Boa.Constrictor.Screenplay;
using Boa.Constrictor.Selenium;
using Dokimion.Pages;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Dokimion.Interactions
{
    internal class CreatTestCase : ITask
    {
        public string TestcaseName { get; }
        public string TestcaseDesription { get; }

        private CreatTestCase(string name, string description)
        {
            this.TestcaseName = name;
            this.TestcaseDesription = description;
        }

        public static CreatTestCase For(string name, string description) =>
          new CreatTestCase(name, description);


        public void PerformAs(IActor actor)
        {
                UserActions userActions = new UserActions();
            userActions.LogConsoleMessage("Click on the Testcases on header");
            actor.AttemptsTo(Click.On(Header.TestCases));

            userActions.LogConsoleMessage("Click on the '+' to Add Test cases");
            actor.AttemptsTo(Click.On(TestCases.AddTestCase));

            userActions.LogConsoleMessage("Enter the Test Case Name");
            actor.WaitsUntil(Appearance.Of(TestCases.TestCaseName), IsEqualTo.True());
            actor.AttemptsTo(Clear.On(TestCases.TestCaseName));
            actor.AttemptsTo(SendKeys.To(TestCases.TestCaseName, TestcaseName));

            userActions.LogConsoleMessage("Enter the Test Case Description");
            actor.AttemptsTo(SendKeys.To(TestCases.TestCaseDescription, TestcaseDesription));

            userActions.LogConsoleMessage("Submit the Save Chnages button");
            actor.AttemptsTo(Click.On(TestCases.SaveTestCaseButton));

        }
    }
}
