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

        // Click the "Add" button to open the new-attribute editor, retrying the click until the
        // name field actually appears. The very first Add click on a freshly loaded Attributes page
        // can be swallowed while the attribute list is still loading (this is the failure behind
        // TC11's flaky "AttributeName did not appear" timeout, since TC11 runs first); a re-click
        // once the page settles opens the editor. Shared by TC11-TC15 and CreateTempAttribute.
        private void OpenNewAttributeForm()
        {
            Actor.WaitsUntil(Appearance.Of(Attributes.AddAttributes), IsEqualTo.True(), timeout: 60);

            for (int attempt = 0; attempt < 4; attempt++)
            {
                Attributes.AddAttributes.FindElement(driver).Click();
                new Actions(driver).Pause(TimeSpan.FromSeconds(2)).Build().Perform();
                if (Actor.AskingFor(Appearance.Of(Attributes.AttributeName))) break;
            }

            Actor.WaitsUntil(Appearance.Of(Attributes.AttributeName), IsEqualTo.True(), timeout: 60);
        }

        [Test]
        public void TC11AddFunctionalityAttribute()
        {
            userActions.LogConsoleMessage(TestContext.CurrentContext.Test.MethodName!);
            userActions.LogConsoleMessage("Set Up : ");


            userActions.LogConsoleMessage("Action steps : ");
            userActions.LogConsoleMessage("Click on the Add button");
            OpenNewAttributeForm();

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
            OpenNewAttributeForm();

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
            OpenNewAttributeForm();

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
            OpenNewAttributeForm();

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
            OpenNewAttributeForm();

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

        // A throwaway TESTCASE attribute created fresh for each bulk test and deleted in cleanup.
        // Because the seed test cases never carry it, bulk Add then bulk Remove is an exact,
        // non-destructive round trip: Add gives each target the attribute, Remove (of its only
        // value) empties it so the whole attribute is deleted -> the "no longer has attribute"
        // assertion holds. Reusing a real seed attribute (e.g. Functionality, whose first value
        // is "Authentication") instead would (a) leave the seed's other values behind so Remove
        // never clears the card, and (b) strip the grouping values that TC16-TC19 depend on.
        // See handleBulkRemoveAttributes in TestCases.js.
        private const string TempAttribute = "BulkTestAttr";
        private const string TempAttributeValue = "BulkTestVal";

        // The exact set of TESTCASE attributes Dokimion_LS must contain for the bulk tests (and the
        // grouping tests TC16-TC19) to behave. TC16-TC19 group by the first three attributes in the
        // dropdown and assert exactly three groups, so ANY extra attribute (e.g. a leftover
        // BulkTestAttr) or a missing seed attribute silently corrupts them. AssertSeedAttributesIntact
        // checks this before each bulk test creates its throwaway attribute.
        private static readonly List<string> ExpectedLSAttributes = new List<string>
        {
            "Functionality", "Placement", "Priority"
        };

        // Exercises the bulk "Add Attributes" action (handleBulkAddAttributes in TestCases.js,
        // driven by the Add Attributes button in TestCasesFilter.js). Logs in as admin (done in
        // Setup), creates a throwaway attribute in Dokimion_LS, selects exactly three test cases,
        // builds a one-attribute block in the Filter rows, clicks Add Attributes, then opens each
        // of the three test cases and verifies the attribute is present. Cleanup reverts the add
        // and deletes the throwaway attribute so the project is left exactly as it started.
        [Test]
        public void TC21AddBulkAttributes()
        {
            userActions.LogConsoleMessage(TestContext.CurrentContext.Test.MethodName!);

            try
            {
                // Create the throwaway attribute INSIDE the try so the finally below always runs and
                // BulkTestAttr is deleted at the end of TC21 - even if CreateTempAttribute (or its
                // AssertSeedAttributesIntact precondition) throws, or any later step fails.
                userActions.LogConsoleMessage("Set Up : create a throwaway TESTCASE attribute in Dokimion_LS");
                CreateTempAttribute();

                userActions.LogConsoleMessage("Set Up : switch to the Dokimion_LS project and open TestCases");
                OpenProjectLSTestCases();

                userActions.LogConsoleMessage("Action steps : select the 3 target test cases and build the temp-attribute block");
                SelectTargetsAndBuildBlock();

                userActions.LogConsoleMessage("Click the Add Attributes button");
                Actor.WaitsUntil(Appearance.Of(TestCases.AddAttributesButton), IsEqualTo.True(), timeout: 60);
                Actor.AttemptsTo(Click.On(TestCases.AddAttributesButton));

                userActions.LogConsoleMessage("Verify : confirmation popup is displayed");
                Actor.WaitsUntil(Text.Of(TestCases.BulkAttributeMessage), ContainsSubstring.Text("Added Attributes in selected Testcases"), timeout: 60);

                // Navigate via Projects first so the TestCases component mounts fresh before verifying.
                // Same reason as TC22's Act step: a same-URL SPA navigation (Click.On(Header.TestCases))
                // does not remount the component, leaving the filter rows from the Add step in place.
                userActions.LogConsoleMessage("Verify : open each test case from a fresh mount and confirm it now has the temp attribute");
                OpenProjectLSTestCases();
                foreach (string tcName in BulkTargets)
                {
                    Actor.AttemptsTo(Click.On(Header.TestCases));
                    OpenTestCase(tcName);
                    AssertTestCaseHasAttribute(tcName, TempAttribute);
                }
            }
            finally
            {
                // Revert: strip the temp attribute value from the three test cases, then delete the
                // attribute definition. Both steps are best-effort so cleanup never fails the test.
                userActions.LogConsoleMessage("Clean up : remove the temp attribute from the three test cases, then delete it");
                try
                {
                    // Navigate via the Projects page so the TestCases component mounts fresh.
                    // A same-URL SPA navigation (Click.On(Header.TestCases) from within
                    // SelectTargetsAndBuildBlock) does not remount the component, leaving the
                    // filter rows from the Add step in place and breaking FilterValuePlaceholder.
                    OpenProjectLSTestCases();
                    SelectTargetsAndBuildBlock();
                    Actor.WaitsUntil(Appearance.Of(TestCases.RemoveAttributesButton), IsEqualTo.True(), timeout: 60);
                    Actor.AttemptsTo(Click.On(TestCases.RemoveAttributesButton));
                    Actor.WaitsUntil(Text.Of(TestCases.BulkAttributeMessage), ContainsSubstring.Text("Removed Attributes in selected Testcases"), timeout: 60);
                }
                catch (Exception ex) { userActions.LogConsoleMessage("Cleanup (Remove Attributes) failed (ignored): " + ex); }

                try { DeleteTempAttribute(); }
                catch (Exception ex) { userActions.LogConsoleMessage("Cleanup (Delete temp attribute) failed (ignored): " + ex); }
            }
        }

        // Exercises the bulk "Remove Attributes" action (handleBulkRemoveAttributes in TestCases.js,
        // driven by the Remove Attributes button in TestCasesFilter.js). Creates a throwaway
        // attribute, arranges by adding it to the three test cases, removes it via Remove Attributes,
        // then verifies it is gone from each of the three. Cleanup deletes the throwaway attribute.
        [Test]
        public void TC22RemoveBulkAttributes()
        {
            userActions.LogConsoleMessage(TestContext.CurrentContext.Test.MethodName!);

            try
            {
                // Create the throwaway attribute INSIDE the try so the finally below always runs and
                // BulkTestAttr is deleted at the end of TC22 - even if CreateTempAttribute (or its
                // AssertSeedAttributesIntact precondition) throws, or any later step fails.
                userActions.LogConsoleMessage("Set Up : create a throwaway TESTCASE attribute in Dokimion_LS");
                CreateTempAttribute();

                userActions.LogConsoleMessage("Set Up : switch to the Dokimion_LS project and open TestCases");
                OpenProjectLSTestCases();

                // Arrange: add the temp attribute to the three test cases so there is something to remove.
                userActions.LogConsoleMessage("Arrange : add the temp attribute to the three test cases");
                SelectTargetsAndBuildBlock();
                Actor.WaitsUntil(Appearance.Of(TestCases.AddAttributesButton), IsEqualTo.True(), timeout: 60);
                Actor.AttemptsTo(Click.On(TestCases.AddAttributesButton));
                Actor.WaitsUntil(Text.Of(TestCases.BulkAttributeMessage), ContainsSubstring.Text("Added Attributes in selected Testcases"), timeout: 60);

                // Act: remove the temp attribute from the same three test cases.
                // Navigate via Projects first so the TestCases component mounts fresh —
                // same-URL SPA navigation leaves the filter rows from the Arrange step in place.
                userActions.LogConsoleMessage("Action steps : remove the temp attribute from the three test cases");
                OpenProjectLSTestCases();
                SelectTargetsAndBuildBlock();
                Actor.WaitsUntil(Appearance.Of(TestCases.RemoveAttributesButton), IsEqualTo.True(), timeout: 60);
                Actor.AttemptsTo(Click.On(TestCases.RemoveAttributesButton));

                userActions.LogConsoleMessage("Verify : confirmation popup is displayed");
                Actor.WaitsUntil(Text.Of(TestCases.BulkAttributeMessage), ContainsSubstring.Text("Removed Attributes in selected Testcases"), timeout: 60);

                userActions.LogConsoleMessage("Verify : each of the three test cases no longer has the temp attribute");
                foreach (string tcName in BulkTargets)
                {
                    Actor.AttemptsTo(Click.On(Header.TestCases));
                    OpenTestCase(tcName);
                    AssertTestCaseDoesNotHaveAttribute(tcName, TempAttribute);
                }
            }
            finally
            {
                // Best-effort: if the test bailed after Add but before Remove, strip the attribute so
                // the targets are left clean, then delete the attribute definition. Never fail from cleanup.
                userActions.LogConsoleMessage("Clean up : ensure the temp attribute is removed from the targets, then delete it");
                try
                {
                    // Same reason as TC21: navigate via Projects to get a fresh TestCases mount.
                    OpenProjectLSTestCases();
                    SelectTargetsAndBuildBlock();
                    Actor.WaitsUntil(Appearance.Of(TestCases.RemoveAttributesButton), IsEqualTo.True(), timeout: 60);
                    Actor.AttemptsTo(Click.On(TestCases.RemoveAttributesButton));
                    Actor.WaitsUntil(Text.Of(TestCases.BulkAttributeMessage), ContainsSubstring.Text("Removed Attributes in selected Testcases"), timeout: 60);
                }
                catch (Exception ex) { userActions.LogConsoleMessage("Cleanup (Remove Attributes) failed (ignored): " + ex); }

                try { DeleteTempAttribute(); }
                catch (Exception ex) { userActions.LogConsoleMessage("Cleanup (Delete temp attribute) failed (ignored): " + ex); }
            }
        }

        // ----- helpers for TC21 / TC22 -----

        // Lower-cases an XPath string() so element matching is case-insensitive.
        private static string Lower(string xpathExpr) =>
            $"translate({xpathExpr},'ABCDEFGHIJKLMNOPQRSTUVWXYZ','abcdefghijklmnopqrstuvwxyz')";

        // Open the TestCases list (resetting any prior filter/selection), select exactly the three
        // target test cases, and build the one-attribute filter block (the temp attribute + its only
        // value). Shared by the Add step and the Remove cleanup so both operate on the same
        // selection + block. The block tells handleBulkAdd/RemoveAttributes WHICH attribute/value to
        // apply; the checked-and-displayed test cases are the targets. (The block is NOT applied as a
        // filter, so the tree still lists every test case — SelectOnlyTestCases unchecks non-targets.)
        private void SelectTargetsAndBuildBlock()
        {
            Actor.AttemptsTo(Click.On(Header.TestCases));
            Actor.WaitsUntil(TextList.For(TestCases.GetTestCaseNameList), IsAnEnumerable<string>.WhereTheCount(IsGreaterThanOrEqualTo.Value(1)), timeout: 60);

            userActions.LogConsoleMessage("Select exactly the three target test cases (uncheck everything else)");
            SelectOnlyTestCases(BulkTargets);

            userActions.LogConsoleMessage("Put the temp attribute in the filter box and pick its only value");
            // NOTE: do NOT use Filter1Selector here. It locates the first "Select..." placeholder on
            // the page, which works only when a Grouping value was chosen first (as
            // CreateSmokeTestFilter does). This test does not set Grouping, so that placeholder is the
            // empty Grouping select -> clicking it opens the wrong menu and the value option never
            // appears (the hang). FilterValuePlaceholder is scoped to the value control and always
            // points at the current row's value select. A single row also avoids the
            // FilterValuePlaceholder row-shifting that a second filter row would introduce.
            Actor.AttemptsTo(Hover.Over(TestCases.Filter1Locator));
            Actor.AttemptsTo(Click.On(TestCases.Filter1Locator));
            ClickReactSelectOption(TempAttribute);
            Actor.AttemptsTo(Click.On(TestCases.FilterValuePlaceholder));
            Actor.AttemptsTo(Click.On(TestCases.Filter1AttribValue));
        }

        // Create the throwaway single-value attribute (TempAttribute = its only value) in
        // Dokimion_LS. Called at the start of TC21/TC22 so the bulk Add/Remove has an attribute the
        // seed test cases never carry. Navigates to Dokimion_LS's Attributes page, clicks Add, and
        // reuses CreateAttributes; then waits for the new attribute card to confirm it was saved.
        private void CreateTempAttribute()
        {
            OpenProjectLSAttributes();

            // Self-heal: drop any leftover BulkTestAttr from a previous aborted run BEFORE the seed
            // check, so our own throwaway artifact never fails the test. (A stray BulkTestAttr is
            // harmless and removable; only genuine corruption should fail fast.)
            RemoveTempAttributeCardIfPresent();

            // Fail fast if Dokimion_LS is still not in its expected clean state (a missing seed
            // attribute, or some unexpected attribute we did not create). Doing this here turns real
            // corruption into a clear, actionable failure on TC21/TC22 instead of a confusing
            // TC16-TC19 grouping bug.
            AssertSeedAttributesIntact();

            OpenNewAttributeForm();

            Actor.AttemptsTo(CreateAttributes.For(TempAttribute, new List<string>() { TempAttributeValue }, driver));

            IWebLocator tempAttrHeading = new WebLocator("TempAttrHeading", By.XPath($"//b[text()='{TempAttribute}']"));
            Actor.WaitsUntil(Appearance.Of(tempAttrHeading), IsEqualTo.True(), timeout: 60);
        }

        // Delete the throwaway attribute from Dokimion_LS. Used in cleanup (best-effort), so it
        // navigates to the Attributes page itself rather than assuming where the test left off.
        private void DeleteTempAttribute()
        {
            OpenProjectLSAttributes();
            RemoveTempAttributeCardIfPresent();
        }

        // Delete ONLY the BulkTestAttr card if it is present; no-op otherwise. Assumes the Dokimion_LS
        // Attributes page is already open. Shared by CreateTempAttribute (self-heal before the seed
        // check) and DeleteTempAttribute (cleanup).
        //
        // DeleteAttribute is deliberately NOT reused here: it clicks the first pencil on the page
        // ((//svg[@data-icon='pencil-alt'])[1]), which is correct in TC11-TC15 (one attribute card at a
        // time) but WRONG on Dokimion_LS, which has several seed attribute cards
        // (Functionality/Priority/Placement that TC16-TC19 depend on) - there it would open and Remove
        // the first/seed card and leave BulkTestAttr behind. Each attribute renders as
        // <div class="alert"><h5 class="alert-heading"><b>name</b><span class="edit-icon">pencil</span>
        // </h5>...</div> (see attributes/Attributes.js), so we target the pencil inside the heading
        // whose <b> text is exactly BulkTestAttr.
        private void RemoveTempAttributeCardIfPresent()
        {
            // Wait for the attribute list to finish loading so a not-yet-rendered card is not mistaken
            // for an absent one.
            Actor.WaitsUntil(Appearance.Of(Attributes.AddAttributes), IsEqualTo.True(), timeout: 60);
            new Actions(driver).Pause(TimeSpan.FromSeconds(2)).Build().Perform();

            IWebLocator heading = new WebLocator("TempAttrHeading", By.XPath($"//b[text()='{TempAttribute}']"));
            if (!Actor.AskingFor(Appearance.Of(heading))) return; // not present — nothing to delete

            // The pencil is visibility:hidden until its h5 heading is hovered (see App.css:
            // "h5:hover .edit-icon { visibility: visible }"), and Selenium treats a visibility:hidden
            // element as not displayed - so hover the heading first to reveal the pencil, then click it.
            // Same pattern as DeleteAttribute.
            Actor.AttemptsTo(Hover.Over(heading));

            IWebLocator editPencil = new WebLocator("TempAttrEditPencil",
                By.XPath($"//h5[contains(@class,'alert-heading')][b[text()='{TempAttribute}']]//span[contains(@class,'edit-icon')]"));
            Actor.AttemptsTo(Hover.Over(editPencil));
            Actor.AttemptsTo(Click.On(editPencil));

            Actor.WaitsUntil(Appearance.Of(Attributes.RemoveAttribButton), IsEqualTo.True(), timeout: 60);
            Actor.AttemptsTo(Hover.Over(Attributes.RemoveAttribButton));
            Actor.AttemptsTo(Click.On(Attributes.RemoveAttribButton));

            // Confirm the BulkTestAttr card is actually gone before returning.
            Actor.WaitsUntil(Appearance.Of(heading), IsEqualTo.False(), timeout: 60);
        }

        // Assert that the Dokimion_LS Attributes page shows EXACTLY the expected seed attributes and
        // nothing else. Must be called while on the Dokimion_LS Attributes page. Each attribute renders
        // as <h5 class="alert-heading"><b>name</b>...</h5> (see attributes/Attributes.js), so the card
        // names are the <b> texts under those headings. The Add button is always present once the page
        // is loaded; we wait for it, then give the attribute list a moment to render before reading.
        private void AssertSeedAttributesIntact()
        {
            Actor.WaitsUntil(Appearance.Of(Attributes.AddAttributes), IsEqualTo.True(), timeout: 60);
            new Actions(driver).Pause(TimeSpan.FromSeconds(2)).Build().Perform();

            IWebLocator attrNames = new WebLocator("AttributeCardNames", By.XPath("//h5[contains(@class,'alert-heading')]/b"));
            List<string> actual = attrNames.FindElements(driver)
                .Select(e => (e.Text ?? "").Trim())
                .OrderBy(n => n)
                .ToList();
            List<string> expected = ExpectedLSAttributes.OrderBy(n => n).ToList();

            Assert.That(actual, Is.EqualTo(expected),
                $"Dokimion_LS must contain exactly these attributes before running this test: " +
                $"[{string.Join(", ", expected)}], but found: [{string.Join(", ", actual)}]. " +
                $"A leftover '{TempAttribute}' or a missing/renamed seed attribute will break TC16-TC19. " +
                $"Restore the Dokimion_LS attributes to the expected set and re-run.");
        }

        // Open the Projects dropdown and click into the Dokimion_LS project landing page. The
        // "Projects" link is a dropdown toggle, and a single click is occasionally swallowed when
        // the page is still re-rendering right after a save or navigation (this is the failure
        // mode behind TC21's flaky "All Link did not appear" timeout: the menu never opened). Retry
        // the toggle until the "All" item is actually visible, then proceed. Shared by both
        // OpenProjectLS* helpers so the fix applies wherever we switch into Dokimion_LS.
        private void SwitchToDokimionLS()
        {
            Actor.WaitsUntil(Appearance.Of(Header.ProjectsLink), IsEqualTo.True(), timeout: 30);

            for (int attempt = 0; attempt < 4; attempt++)
            {
                Actor.AttemptsTo(Click.On(Header.ProjectsLink));
                new Actions(driver).Pause(TimeSpan.FromSeconds(1)).Build().Perform();
                if (Actor.AskingFor(Appearance.Of(Header.AllLink))) break;
            }

            Actor.WaitsUntil(Appearance.Of(Header.AllLink), IsEqualTo.True(), timeout: 30);
            Actor.AttemptsTo(Click.On(Header.AllLink));

            Actor.WaitsUntil(Appearance.Of(Header.DokimionLaunchStatisticsProject), IsEqualTo.True(), timeout: 30);
            Actor.AttemptsTo(Click.On(Header.DokimionLaunchStatisticsProject));
        }

        // Switch from the current project to Dokimion_LS and open its Attributes page.
        // Mirrors OpenProjectLSTestCases but lands on Attributes instead of TestCases.
        private void OpenProjectLSAttributes()
        {
            SwitchToDokimionLS();

            Actor.WaitsUntil(Appearance.Of(Header.Attributes), IsEqualTo.True(), timeout: 30);
            Actor.AttemptsTo(Click.On(Header.Attributes));
        }

        // Switch from the current project to Dokimion_LS and open its TestCases page.
        private void OpenProjectLSTestCases()
        {
            SwitchToDokimionLS();

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
