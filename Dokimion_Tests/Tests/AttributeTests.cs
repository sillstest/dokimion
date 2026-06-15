using Boa.Constrictor.Screenplay;
using Boa.Constrictor.Selenium;
using Dokimion.Interactions;
using Dokimion.Pages;
using FluentAssertions;
using OpenQA.Selenium;
using OpenQA.Selenium.Chrome;
using OpenQA.Selenium.Interactions;
using WebDriverManager;
using WebDriverManager.DriverConfigs.Impl;
using WebDriverManager.Helpers;

namespace Dokimion.Tests
{
    internal class AttributeTests
    {
        private IActor Actor;
        UserActions userActions;
        ChromeDriver driver;

        [OneTimeSetUp]
        public void Setup()
        {

            userActions = new UserActions();
            userActions.LogConsoleMessage("In one time Set up :" + TestContext.CurrentContext.Test.ClassName);

            Actor = new Actor(name: userActions.ActorName, logger: new NoOpLogger());
            var count = 1;

            try
            {

                //This will match ChromeDriver and web browser versions
                new DriverManager().SetUpDriver(new ChromeConfig(), VersionResolveStrategy.MatchingBrowser);

                driver = new ChromeDriver(userActions.GetChromeOptions());

                driver.Manage().Window.Maximize();
                driver.Manage().Timeouts().PageLoad = TimeSpan.FromSeconds(300);

                ICapabilities capabilities = driver.Capabilities;
                var browserName = capabilities.GetCapability("browserName");
                var browserVersion = capabilities.GetCapability("browserVersion");
                var SeleniumWebDriverVersion = (capabilities.GetCapability("chrome") as Dictionary<string, object>)!["chromedriverVersion"];

                userActions.LogConsoleMessage("BrowserName : " + browserName);
                userActions.LogConsoleMessage("browserVersion : " + browserVersion);
                userActions.LogConsoleMessage("ChromeDriver : " + driver.GetType().ToString());
                userActions.LogConsoleMessage("SeleniumWebDriverVersion " + SeleniumWebDriverVersion);

                userActions.LogConsoleMessage("Register Driver & Open the Dokimion website");
                Actor.Can(BrowseTheWeb.With(driver));
                Actor.AttemptsTo(Navigate.ToUrl(userActions.DokimionUrl));
                //Actor.AttemptsTo(Navigate.ToUrl("http://192.168.56.103"));
                //Page is redirected after initial URL
                Actor.AttemptsTo(Wait.Until(Appearance.Of(LoginPage.NameInput), IsEqualTo.True()));
            }
            catch (Exception ex)
            {
                userActions.captureScreenShot(driver, "AttributeTests");

                count++;
                Actor.AttemptsTo(Wait.Until(Appearance.Of(LoginPage.NameInput), IsEqualTo.True()).ForAnAdditional(3));
                userActions.LogConsoleMessage("Unable to load page : retried with addtionatime on " + count + " " + ex.ToString());

            }

            Actor.WaitsUntil(Appearance.Of(LoginPage.LoginPageWelcomeMsg), IsEqualTo.True());
            var welcomeMessage = Actor.AskingFor(Text.Of(LoginPage.LoginPageWelcomeMsg));
            userActions.LogConsoleMessage("Login Page is loaded successfully on count " + count + " " + welcomeMessage);

            userActions.LogConsoleMessage("Set Up : ");
            userActions.LogConsoleMessage("Login as Admin");
            Actor.AttemptsTo(LoginUser.For(userActions.AdminUser!, userActions.AdminPass!));
            Actor.WaitsUntil(Appearance.Of(Header.DokimionProject), IsEqualTo.True(), timeout: 15);
            Actor.AttemptsTo(Click.On(Header.DokimionProject));

            //Click on attributes only once
            userActions.LogConsoleMessage("Click on the Attributes on header");
            Actor.AttemptsTo(Click.On(Header.Attributes));

        }


        [OneTimeTearDown]
        public void QuitBrowser()
        {

            Actor.AttemptsTo(Logout.For());
            Actor.AttemptsTo(QuitWebDriver.ForBrowser());
        }

        [TearDown]
        public void TearDownAfterTestCase()
        {
            userActions.TearDownAfterTestcase();
        }

        [Test]
        public void TC11AddFunctionalityAttribute()
        {
            userActions.LogConsoleMessage(TestContext.CurrentContext.Test.MethodName!);
            userActions.LogConsoleMessage("Set Up : ");


            userActions.LogConsoleMessage("Action steps : ");
            userActions.LogConsoleMessage("Click on the Add button");
            Actor.WaitsUntil(Appearance.Of(Attributes.AddAttributes), IsEqualTo.True(), timeout: 60);
            Attributes.AddAttributes.FindElement(driver).Click();

            userActions.LogConsoleMessage("Enter Name: Functionality ");
            userActions.LogConsoleMessage("Enter Values: Authentication,TestCase, TestSuites,Projects, Launch");
            userActions.LogConsoleMessage("Click on Add values button ");

            Actor.AttemptsTo(CreateAttributes.For("Functionality", new List<string>() { "Authentication" ,
                "TestCase", "TestSuites", "Projects", "Launch" }, driver));

            userActions.LogConsoleMessage("Click on Save changes button ");
            //Check the functionality header is there
            //With values
            string name = Actor.AskingFor(Text.Of(Attributes.FunctionalityAttrib));
            string values = Actor.AskingFor(Text.Of(Attributes.VerifyAttributesList));
            Assert.That(name.Trim(), Is.EqualTo("Functionality"));
            StringAssert.Contains("Authentication, TestCase, TestSuites, Projects, Launch", values.Trim());

            userActions.LogConsoleMessage("Clean up: Click on Remove button to delete the attribute ");
            Actor.AttemptsTo(DeleteAttribute.For("Functionality"));

        }

        [Test]
        public void TC12EditFunctionalityAttribute()
        {
            userActions.LogConsoleMessage(TestContext.CurrentContext.Test.MethodName!);
            userActions.LogConsoleMessage("Set Up : ");


            userActions.LogConsoleMessage("Action steps : ");
            userActions.LogConsoleMessage("Click on the Add button");
            Actor.WaitsUntil(Appearance.Of(Attributes.AddAttributes), IsEqualTo.True(), timeout: 60);
            Attributes.AddAttributes.FindElement(driver).Click();

            userActions.LogConsoleMessage("Add Functionality Attribute with values Authentication, TestCase," +
                "TestSuites, Projects, Launch");
            //Create Functionality again
            Actor.AttemptsTo(CreateAttributes.For("Functionality", new List<string>() { "Authentication" ,
                "TestCase", "TestSuites", "Projects", "Launch" }, driver));


            Actor.AttemptsTo(Hover.Over(Attributes.FunctionalityAttrib));

            userActions.LogConsoleMessage("Click on edit 'pencil' to add Faulty Attribute");

            Actor.AttemptsTo(Hover.Over(Attributes.EditAttribSVG));
            Actor.AttemptsTo(Click.On(Attributes.EditAttribSVG));

            userActions.LogConsoleMessage("Click on Add Value button ");

            Actor.AttemptsTo(Hover.Over(Attributes.AddAttributeValueButton));

            Actor.AttemptsTo(Click.On(Attributes.AddAttributeValueButton));

            var attribValueLocator = $"//input[@name='value' and @index='5']";

            Actor.WaitsUntil(Appearance.Of(new WebLocator("AttribValueLocator", By.XPath(attribValueLocator))), IsEqualTo.True(), timeout: 60);
            IWebElement attribLocator = driver.FindElement(By.XPath(attribValueLocator));

            userActions.LogConsoleMessage("Enter 'Faulty' in the value ");
            Actor.AttemptsTo(SendKeys.To(new WebLocator("AttribValueLocator", By.XPath(attribValueLocator)), "Faulty"));

            userActions.LogConsoleMessage("Click on Save button ");

            Attributes.SaveAttribute.FindElement(driver).Click();

            Actor.WaitsUntil(Text.Of(Attributes.VerifyAttributesList), ContainsSubstring.Text("Faulty"), timeout: 60);

            string name = Actor.AskingFor(Text.Of(Attributes.FunctionalityAttrib));
            string values = Actor.AskingFor(Text.Of(Attributes.VerifyAttributesList));

            userActions.LogConsoleMessage("Verify : Faulty is added to Functionality ");


            Assert.That(name.Trim(), Is.EqualTo("Functionality"));
            Assert.That(values.Contains("Faulty"), Is.True);


            userActions.LogConsoleMessage("Clean up: Delete the attribute ");
            Actor.AttemptsTo(DeleteAttribute.For("Functionality"));


        }


        [Test]
        public void TC13DeleteFunctionalityAttribute_Faulty()
        {
            userActions.LogConsoleMessage(TestContext.CurrentContext.Test.MethodName!);
            userActions.LogConsoleMessage("Set Up : ");

            userActions.LogConsoleMessage("Action steps : ");
            userActions.LogConsoleMessage("Click on the Add button");
            Actor.WaitsUntil(Appearance.Of(Attributes.AddAttributes), IsEqualTo.True(), timeout: 60);
            Attributes.AddAttributes.FindElement(driver).Click();

            userActions.LogConsoleMessage("Add Functionality Attribute with values Authentication, TestCase," +
                "TestSuites, Projects, Launch , Faulty");
            Actor.AttemptsTo(CreateAttributes.For("Functionality", new List<string>() { "Authentication" ,
                "TestCase", "TestSuites", "Projects", "Launch", "Faulty" }, driver));


            Actor.AttemptsTo(Hover.Over(Attributes.FunctionalityAttrib));

            userActions.LogConsoleMessage("Click on edit 'pencil' to modify Functionality attribute");

            Actor.AttemptsTo(Hover.Over(Attributes.EditAttribSVG));
            Actor.AttemptsTo(Click.On(Attributes.EditAttribSVG));

            userActions.LogConsoleMessage("Click on 'delete' to modify Functionality attribute to delete Faulty");

            //Add logic to remove n save
            IWebLocator DeleteSVG = new WebLocator("DeleteSVG", By.XPath("(//*[local-name()='svg' and @data-icon='minus-circle'])[6]"));

            Actor.AttemptsTo(Hover.Over(DeleteSVG));
            Actor.AttemptsTo(Click.On(DeleteSVG));

            Actor.WaitsUntil(Appearance.Of(Attributes.SaveAttribute), IsEqualTo.True(), timeout: 60);

            userActions.LogConsoleMessage("Click on Save Changes button");
            Attributes.SaveAttribute.FindElement(driver).Click();
            //var check = ContainsSubstring.Text("Goodbye").Evaluate("Hello World!").Should().BeFalse();
            Actor.WaitsUntil(Text.Of(Attributes.VerifyAttributesList), IsEqualTo.Value("Authentication, TestCase, TestSuites, Projects, Launch")
             , timeout: 60);
            //  Actor.WaitsUntil(Appearance.Of(Attributes.VerifyAttributesList), IsEqualTo.True(), timeout: 60);

            string name = Actor.AskingFor(Text.Of(Attributes.FunctionalityAttrib));
            string values = Actor.AskingFor(Text.Of(Attributes.VerifyAttributesList));

            userActions.LogConsoleMessage("Verify: Faulty is not available in Functionality attribute");

            Assert.That(name.Trim(), Is.EqualTo("Functionality"));
            StringAssert.DoesNotContain("Faulty", values.Trim());

            userActions.LogConsoleMessage("Clean up: Delete the attribute ");
            Actor.AttemptsTo(DeleteAttribute.For("Functionality"));

        }


        [Test]
        public void TC14AddPriorityAttribute()
        {
            userActions.LogConsoleMessage(TestContext.CurrentContext.Test.MethodName!);
            userActions.LogConsoleMessage("Set Up : ");


            userActions.LogConsoleMessage("Action steps : ");
            userActions.LogConsoleMessage("Click on the Add button");
            Actor.WaitsUntil(Appearance.Of(Attributes.AddAttributes), IsEqualTo.True(), timeout: 60);

            Attributes.AddAttributes.FindElement(driver).Click();

            userActions.LogConsoleMessage("Enter Name: ");
            userActions.LogConsoleMessage("Enter Values: ");
            userActions.LogConsoleMessage("Click on Add values button ");
            userActions.LogConsoleMessage("Add attribute 'Priority' with values High, Medium and Low ");

            Actor.AttemptsTo(CreateAttributes.For("Priority", new List<string>() { "High" ,
                "Medium","Low" }, driver));

            userActions.LogConsoleMessage("Click on Save changes button ");

            //With values
            string name = Actor.AskingFor(Text.Of(Attributes.PriorityAttrib));
            string values = Actor.AskingFor(Text.Of(Attributes.VerifyAttributesList));

            userActions.LogConsoleMessage("Verify : Priority attribute is added");
            Assert.That(name.Trim(), Is.EqualTo("Priority"));
            Assert.That(values.Trim(), Is.EqualTo("High, Medium, Low"));

            userActions.LogConsoleMessage("Clean up: Delete the attribute ");
            Actor.AttemptsTo(DeleteAttribute.For("Priority"));
        }

        [Test]
        public void TC15AddPlacmentAttribute()
        {
            userActions.LogConsoleMessage(TestContext.CurrentContext.Test.MethodName!);
            userActions.LogConsoleMessage("Set Up : ");


            userActions.LogConsoleMessage("Action steps : ");
            userActions.LogConsoleMessage("Click on the Add button");
            Actor.WaitsUntil(Appearance.Of(Attributes.AddAttributes), IsEqualTo.True(), timeout: 60);

            Attributes.AddAttributes.FindElement(driver).Click();

            userActions.LogConsoleMessage("Enter Name: ");
            userActions.LogConsoleMessage("Enter Values: ");
            userActions.LogConsoleMessage("Click on Add values button ");
            userActions.LogConsoleMessage("Add attibute 'Placement' with values Header, Footer and Body");

            Actor.AttemptsTo(CreateAttributes.For("Placement", new List<string>() { "Header" ,
                "Footer","Body" }, driver));

            userActions.LogConsoleMessage("Click on Save changes button ");

            //With values
            string name = Actor.AskingFor(Text.Of(Attributes.PlacementAttrib));
            string values = Actor.AskingFor(Text.Of(Attributes.VerifyAttributesList));

            userActions.LogConsoleMessage("Verfiy: Placement attribute is added ");

            Assert.That(name.Trim(), Is.EqualTo("Placement"));
            StringAssert.Contains("Header, Footer, Body", values);

            userActions.LogConsoleMessage("Clean up: Delete the attribute ");
            Actor.AttemptsTo(DeleteAttribute.For("Placement"));
        }

        // The three test cases (in project Dokimion_LS) the bulk operation should target.
        private static readonly List<string> BulkTargets = new List<string>
        {
            "Validate login",
            "Projects list page validation",
            "Project dashboard validation"
        };

        // The two attributes to add to those test cases.
        private const string Attribute1 = "Functionality";
        private const string Attribute2 = "Placement";

        // Exercises the bulk "Add Attributes" action (handleBulkAddAttributes in TestCases.js,
        // driven by the Add Attributes button in TestCasesFilter.js). Logs in as admin (done in
        // Setup), switches to Dokimion_LS, selects exactly three test cases, builds a two-attribute
        // block in the Filter rows (each with its first value), clicks Add Attributes, then opens
        // each of the three test cases and verifies both attributes are present.
        [Test]
        public void TC21AddBulkAttributes()
        {
            userActions.LogConsoleMessage(TestContext.CurrentContext.Test.MethodName!);

            userActions.LogConsoleMessage("Set Up : switch to the Dokimion_LS project and open TestCases");
            OpenProjectLSTestCases();

            try
            {
                userActions.LogConsoleMessage("Action steps : select the 3 target test cases and build the 2-attribute block");
                SelectTargetsAndBuildBlock();

                userActions.LogConsoleMessage("Click the Add Attributes button");
                Actor.WaitsUntil(Appearance.Of(TestCases.AddAttributesButton), IsEqualTo.True(), timeout: 60);
                Actor.AttemptsTo(Click.On(TestCases.AddAttributesButton));

                userActions.LogConsoleMessage("Verify : confirmation popup is displayed");
                Actor.WaitsUntil(Text.Of(TestCases.BulkAttributeMessage), ContainsSubstring.Text("Added Attributes in selected Testcases"), timeout: 60);

                userActions.LogConsoleMessage("Verify : each of the three test cases now has both attributes");
                foreach (string tcName in BulkTargets)
                {
                    Actor.AttemptsTo(Click.On(Header.TestCases));
                    OpenTestCase(tcName);
                    AssertTestCaseHasAttribute(tcName, Attribute1);
                    AssertTestCaseHasAttribute(tcName, Attribute2);
                }
            }
            finally
            {
                // Revert: remove the same two attribute values from the same three test cases via
                // the Remove Attributes bulk action. Best-effort, so cleanup never fails the test.
                userActions.LogConsoleMessage("Clean up : remove the two attributes from the same three test cases");
                try
                {
                    SelectTargetsAndBuildBlock();
                    Actor.WaitsUntil(Appearance.Of(TestCases.RemoveAttributesButton), IsEqualTo.True(), timeout: 60);
                    Actor.AttemptsTo(Click.On(TestCases.RemoveAttributesButton));
                    Actor.WaitsUntil(Text.Of(TestCases.BulkAttributeMessage), ContainsSubstring.Text("Removed Attributes in selected Testcases"), timeout: 60);
                }
                catch (Exception ex) { userActions.LogConsoleMessage("Cleanup (Remove Attributes) failed (ignored): " + ex); }
            }
        }

        // Exercises the bulk "Remove Attributes" action (handleBulkRemoveAttributes in TestCases.js,
        // driven by the Remove Attributes button in TestCasesFilter.js). Arranges by adding the two
        // attributes to the three test cases, removes them via Remove Attributes, then verifies both
        // attributes are gone from each of the three.
        [Test]
        public void TC22RemoveBulkAttributes()
        {
            userActions.LogConsoleMessage(TestContext.CurrentContext.Test.MethodName!);

            userActions.LogConsoleMessage("Set Up : switch to the Dokimion_LS project and open TestCases");
            OpenProjectLSTestCases();

            try
            {
                // Arrange: ensure the three test cases have both attributes so there is something to remove.
                userActions.LogConsoleMessage("Arrange : add the two attributes to the three test cases");
                SelectTargetsAndBuildBlock();
                Actor.WaitsUntil(Appearance.Of(TestCases.AddAttributesButton), IsEqualTo.True(), timeout: 60);
                Actor.AttemptsTo(Click.On(TestCases.AddAttributesButton));
                Actor.WaitsUntil(Text.Of(TestCases.BulkAttributeMessage), ContainsSubstring.Text("Added Attributes in selected Testcases"), timeout: 60);

                // Act: remove the same two attributes from the same three test cases.
                userActions.LogConsoleMessage("Action steps : remove the two attributes from the three test cases");
                SelectTargetsAndBuildBlock();
                Actor.WaitsUntil(Appearance.Of(TestCases.RemoveAttributesButton), IsEqualTo.True(), timeout: 60);
                Actor.AttemptsTo(Click.On(TestCases.RemoveAttributesButton));

                userActions.LogConsoleMessage("Verify : confirmation popup is displayed");
                Actor.WaitsUntil(Text.Of(TestCases.BulkAttributeMessage), ContainsSubstring.Text("Removed Attributes in selected Testcases"), timeout: 60);

                userActions.LogConsoleMessage("Verify : each of the three test cases no longer has the two attributes");
                foreach (string tcName in BulkTargets)
                {
                    Actor.AttemptsTo(Click.On(Header.TestCases));
                    OpenTestCase(tcName);
                    AssertTestCaseDoesNotHaveAttribute(tcName, Attribute1);
                    AssertTestCaseDoesNotHaveAttribute(tcName, Attribute2);
                }
            }
            finally
            {
                // Best-effort: if the test bailed after Add but before Remove, strip the attributes so
                // the project is left clean. Never fail the test from cleanup.
                userActions.LogConsoleMessage("Clean up : ensure the two attributes are removed");
                try
                {
                    SelectTargetsAndBuildBlock();
                    Actor.WaitsUntil(Appearance.Of(TestCases.RemoveAttributesButton), IsEqualTo.True(), timeout: 60);
                    Actor.AttemptsTo(Click.On(TestCases.RemoveAttributesButton));
                    Actor.WaitsUntil(Text.Of(TestCases.BulkAttributeMessage), ContainsSubstring.Text("Removed Attributes in selected Testcases"), timeout: 60);
                }
                catch (Exception ex) { userActions.LogConsoleMessage("Cleanup (Remove Attributes) failed (ignored): " + ex); }
            }
        }

        // ----- helpers for TC21 / TC22 -----

        // Lower-cases an XPath string() so element matching is case-insensitive.
        private static string Lower(string xpathExpr) =>
            $"translate({xpathExpr},'ABCDEFGHIJKLMNOPQRSTUVWXYZ','abcdefghijklmnopqrstuvwxyz')";

        // Open the TestCases list (resetting any prior filter/selection), select exactly the three
        // target test cases, and build the two-attribute filter block (each with its first value).
        // Shared by the Add step and the Remove cleanup so both operate on the same selection + block.
        private void SelectTargetsAndBuildBlock()
        {
            Actor.AttemptsTo(Click.On(Header.TestCases));
            Actor.WaitsUntil(TextList.For(TestCases.GetTestCaseNameList), IsAnEnumerable<string>.WhereTheCount(IsGreaterThanOrEqualTo.Value(1)), timeout: 60);

            userActions.LogConsoleMessage("Select exactly the three target test cases (uncheck everything else)");
            SelectOnlyTestCases(BulkTargets);

            userActions.LogConsoleMessage("Put 2 attributes in the filter box and pick the 1st value of each");
            // NOTE: do NOT use Filter1Selector/Filter2Selector here. Those locate the first
            // "Select..." placeholder on the page, which works only when a Grouping value was
            // chosen first (as CreateSmokeTestFilter does). This test does not set Grouping, so
            // that placeholder is the empty Grouping select -> clicking it opens the wrong menu
            // and the value option never appears (the hang). FilterValuePlaceholder is scoped to
            // the value control and always points at the current row's value select.

            // Row 1: attribute "Functionality" + its first value.
            Actor.AttemptsTo(Hover.Over(TestCases.Filter1Locator));
            Actor.AttemptsTo(Click.On(TestCases.Filter1Locator));
            ClickReactSelectOption(Attribute1);
            Actor.AttemptsTo(Click.On(TestCases.FilterValuePlaceholder));
            Actor.AttemptsTo(Click.On(TestCases.Filter1AttribValue));

            // Selecting an attribute in row 1 appends an empty row 2.
            // Row 2: attribute "Placement" + its first value. Once row 1's value is set its
            // placeholder is gone, so FilterValuePlaceholder now points at row 2's value select.
            Actor.AttemptsTo(Hover.Over(TestCases.Filter2Locator));
            Actor.AttemptsTo(Click.On(TestCases.Filter2Locator));
            ClickReactSelectOption(Attribute2);
            Actor.AttemptsTo(Click.On(TestCases.FilterValuePlaceholder));
            Actor.AttemptsTo(Click.On(TestCases.Filter2AttribValue));
        }

        // Switch from the current project to Dokimion_LS and open its TestCases page.
        private void OpenProjectLSTestCases()
        {
            Actor.AttemptsTo(Click.On(Header.ProjectsLink));
            Actor.WaitsUntil(Appearance.Of(Header.AllLink), IsEqualTo.True(), timeout: 30);
            Actor.AttemptsTo(Click.On(Header.AllLink));

            Actor.WaitsUntil(Appearance.Of(Header.DokimionLaunchStatisticsProject), IsEqualTo.True(), timeout: 30);
            Actor.AttemptsTo(Click.On(Header.DokimionLaunchStatisticsProject));

            Actor.WaitsUntil(Appearance.Of(Header.TestCases), IsEqualTo.True(), timeout: 30);
            Actor.AttemptsTo(Click.On(Header.TestCases));

            Actor.WaitsUntil(TextList.For(TestCases.GetTestCaseNameList), IsAnEnumerable<string>.WhereTheCount(IsGreaterThanOrEqualTo.Value(1)), timeout: 60);
        }

        // All test cases are checked by default; uncheck every row whose name is not a target so
        // the bulk operation (which targets the checked, displayed test cases) applies only to them.
        private void SelectOnlyTestCases(List<string> keep)
        {
            Actor.WaitsUntil(TextList.For(TestCases.TestCaseTreeListMain), IsAnEnumerable<string>.WhereTheCount(IsGreaterThanOrEqualTo.Value(1)), timeout: 60);
            var rows = TestCases.TestCaseTreeListMain.FindElements(driver);
            Actions actions = new Actions(driver);
            foreach (var row in rows)
            {
                string name = row.Text ?? "";
                bool isTarget = keep.Any(t => name.ToLower().Contains(t.ToLower()));
                if (!isTarget)
                {
                    try
                    {
                        var checkbox = row.FindElement(By.XPath("descendant::span[@data-role='checkbox']"));
                        actions.MoveToElement(checkbox).Click(checkbox).Build().Perform();
                    }
                    catch (NoSuchElementException) { /* group/non-checkbox row */ }
                }
            }
        }

        // Click an option in the currently-open filter react-select menu by its (case-insensitive) text.
        private void ClickReactSelectOption(string optionText)
        {
            string xpath = $"//div[@class='css-11unzgr']//div[contains(@id,'react-select') and contains({Lower("normalize-space()")},'{optionText.ToLower()}')]";
            IWebLocator option = new WebLocator("ReactSelectOption:" + optionText, By.XPath(xpath));
            Actor.WaitsUntil(Appearance.Of(option), IsEqualTo.True(), timeout: 45);
            Actor.AttemptsTo(Click.On(option));
        }

        // Open a test case from the tree by (case-insensitive) name.
        private void OpenTestCase(string testcaseName)
        {
            string xpath = $"//span[@data-role='display' and contains({Lower("normalize-space()")},'{testcaseName.ToLower()}')]";
            IWebLocator tc = new WebLocator("TestCase:" + testcaseName, By.XPath(xpath));
            Actor.WaitsUntil(Appearance.Of(tc), IsEqualTo.True(), timeout: 60);
            new Actions(driver).MoveToElement(tc.FindElement(driver)).Click().Build().Perform();
        }

        // Assert the open test case's Attributes section shows an attribute card with the given name.
        private void AssertTestCaseHasAttribute(string testcaseName, string attributeName)
        {
            string xpath = $"//div[@id='attributes']//div[@class='card-header']//b[contains({Lower("normalize-space()")},'{attributeName.ToLower()}')]";
            IWebLocator attr = new WebLocator($"{testcaseName} attribute {attributeName}", By.XPath(xpath));
            Actor.WaitsUntil(Appearance.Of(attr), IsEqualTo.True(), timeout: 45);
            userActions.LogConsoleMessage($"Verified '{testcaseName}' has attribute '{attributeName}'");
        }

        // Assert the open test case's Attributes section has NO attribute card with the given name.
        private void AssertTestCaseDoesNotHaveAttribute(string testcaseName, string attributeName)
        {
            string xpath = $"//div[@id='attributes']//div[@class='card-header']//b[contains({Lower("normalize-space()")},'{attributeName.ToLower()}')]";
            IWebLocator attr = new WebLocator($"{testcaseName} attribute {attributeName}", By.XPath(xpath));
            Actor.WaitsUntil(Appearance.Of(attr), IsEqualTo.False(), timeout: 45);
            userActions.LogConsoleMessage($"Verified '{testcaseName}' no longer has attribute '{attributeName}'");
        }
    }

}
