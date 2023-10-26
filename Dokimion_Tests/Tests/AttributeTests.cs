using Boa.Constrictor.Screenplay;
using Boa.Constrictor.Selenium;
using Dokimion.Interactions;
using Dokimion.Pages;
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
            userActions.LogConsoleMessage("Register Driver & Open the Dokimion website");

            Actor = new Actor(name: userActions.ActorName, logger: new NoOpLogger());
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

            var count = 1;

            try
            {
                Actor.Can(BrowseTheWeb.With(driver));
                Actor.AttemptsTo(Navigate.ToUrl(userActions.DokimionUrl));
                //Page is redirected after initial URL
                Actor.AttemptsTo(Wait.Until(Appearance.Of(LoginPage.NameInput), IsEqualTo.True()));
            }
            catch (Exception ex)
            {
                userActions.captureScreenShot(driver, "LoginPageTest");

                count++;
                Actor.AttemptsTo(Wait.Until(Appearance.Of(LoginPage.NameInput), IsEqualTo.True()).ForAnAdditional(3));
                userActions.LogConsoleMessage("Unable to load page : retried with addtionatime on " + count + " " + ex.ToString());

            }

            Actor.WaitsUntil(Appearance.Of(LoginPage.LoginPageWelcomeMsg), IsEqualTo.True());
            var welcomeMessage = Actor.AskingFor(Text.Of(LoginPage.LoginPageWelcomeMsg));
            userActions.LogConsoleMessage("Login Page is loaded successfully on count " + count + " " + welcomeMessage);

            userActions.LogConsoleMessage("Set Up : ");
            userActions.LogConsoleMessage("Login as User");
            Actor.AttemptsTo(LoginUser.For(userActions.Username!, userActions.Password!));
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

            //try
            //{
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
            RemoveAttribute();
            //}catch (Exception ex)
            //{
            //    userActions.LogConsoleMessage(ex.ToString());

            //}
        }

        [Test]
        public void TC12EditFunctionalityAttribute()
        {
            userActions.LogConsoleMessage(TestContext.CurrentContext.Test.MethodName!);
            userActions.LogConsoleMessage("Set Up : ");

            //try
            //{
            userActions.LogConsoleMessage("Action steps : ");
            userActions.LogConsoleMessage("Click on the Add button");
            Actor.WaitsUntil(Appearance.Of(Attributes.AddAttributes), IsEqualTo.True(), timeout: 60);
            Attributes.AddAttributes.FindElement(driver).Click();

            userActions.LogConsoleMessage("Add Functionality Attribute with values Authentication, TestCase," +
                "TestSuites, Projects, Launch");
            //Create Functionality again
            Actor.AttemptsTo(CreateAttributes.For("Functionality", new List<string>() { "Authentication" ,
                "TestCase", "TestSuites", "Projects", "Launch" }, driver));

            //Hover over Functionality to find 
            Actions actions = new Actions(driver);
            actions.Pause(TimeSpan.FromSeconds(1)).Build().Perform();
            actions.MoveToElement(Attributes.FunctionalityAttrib.FindElement(driver)).
            Pause(TimeSpan.FromSeconds(1)).Build().Perform();

            userActions.LogConsoleMessage("Click on edit 'pencil' to add Faulty Attribute");

            //Click on the edit pencil symbol
            IWebElement editAttribute = driver.FindElement(By.XPath("(//*[local-name()='svg' and @data-icon='pencil-alt'])[1]"));

            actions.MoveToElement(editAttribute)
            .Pause(TimeSpan.FromSeconds(1))
                .Click(editAttribute).Build().Perform();


            actions.Pause(TimeSpan.FromSeconds(1)).Build().Perform();
            Actor.AttemptsTo(Click.On(Attributes.AddAttributeValueButton));

            actions.Pause(TimeSpan.FromSeconds(1)).Build().Perform();

            var attribValueLocator = $"//input[@name='value' and @index='5']";

            IWebElement attribLocator = driver.FindElement(By.XPath(attribValueLocator));

            driver.FindElement(By.XPath(
                attribValueLocator)).SendKeys("Faulty");
            Attributes.SaveAttribute.FindElement(driver).Click();

            actions.Pause(TimeSpan.FromSeconds(1)).Build().Perform();
            string name = Actor.AskingFor(Text.Of(Attributes.FunctionalityAttrib));
            string values = Actor.AskingFor(Text.Of(Attributes.VerifyAttributesList));

            userActions.LogConsoleMessage("Verify : Faulty is added to Functionality ");


            Assert.That(name.Trim(), Is.EqualTo("Functionality"));
            Assert.That(values.Contains("Faulty"), Is.True);


            userActions.LogConsoleMessage("Clean up: Delete the attribute ");
            RemoveAttribute();
            //}catch(Exception ex)
            //{

            //    userActions.LogConsoleMessage(ex.ToString());

            //}
        }


        [Test]
        public void TC13DeleteFunctionalityAttribute_Faulty()
        {
            userActions.LogConsoleMessage(TestContext.CurrentContext.Test.MethodName!);
            userActions.LogConsoleMessage("Set Up : ");

            //try
            //{
            userActions.LogConsoleMessage("Action steps : ");
            userActions.LogConsoleMessage("Click on the Add button");
            Actor.WaitsUntil(Appearance.Of(Attributes.AddAttributes), IsEqualTo.True(), timeout: 60);
            Attributes.AddAttributes.FindElement(driver).Click();

            userActions.LogConsoleMessage("Add Functionality Attribute with values Authentication, TestCase," +
                "TestSuites, Projects, Launch");
            Actor.AttemptsTo(CreateAttributes.For("Functionality", new List<string>() { "Authentication" ,
                "TestCase", "TestSuites", "Projects", "Launch", "Faulty" }, driver));

            Actions actions = new Actions(driver);
            actions.Pause(TimeSpan.FromSeconds(1)).Build().Perform();
            actions.MoveToElement(Attributes.FunctionalityAttrib.FindElement(driver)).
            Pause(TimeSpan.FromSeconds(1)).Build().Perform();

            userActions.LogConsoleMessage("Click on edit 'pencil' to modify Functionality attribute");
            IWebElement m = driver.FindElement(By.XPath("(//*[local-name()='svg' and @data-icon='pencil-alt'])[1]"));

            actions.MoveToElement(m)
            .Pause(TimeSpan.FromSeconds(1))
                .Click(m).Build().Perform();

            actions.Pause(TimeSpan.FromSeconds(1)).Build().Perform();

            userActions.LogConsoleMessage("Click on 'delete' to modify Functionality attribute to delete Faulty");

            //Add logic to remove n save
            IWebElement faultyDelete = driver.FindElement(By.XPath("(//*[local-name()='svg' and @data-icon='minus-circle'])[6]"));

            faultyDelete.Click();

            actions.Pause(TimeSpan.FromSeconds(1)).Build().Perform();

            Attributes.SaveAttribute.FindElement(driver).Click();
            //Need to reflect the DOM with removal of attrib
            actions.Pause(TimeSpan.FromSeconds(1)).Build().Perform();
            //With values
            string name = Actor.AskingFor(Text.Of(Attributes.FunctionalityAttrib));
            string values = Actor.AskingFor(Text.Of(Attributes.VerifyAttributesList));

            userActions.LogConsoleMessage("Verify: Faulty is not available in Functionality attribute");

            Assert.That(name.Trim(), Is.EqualTo("Functionality"));

            Assert.That(values.Trim().Contains("Faulty"), Is.Not.True);

            userActions.LogConsoleMessage("Clean up: Delete the attribute ");
            RemoveAttribute();
            //}catch(Exception ex)
            //{
            //    userActions.LogConsoleMessage(ex.ToString());

            //}
        }


        [Test]
        public void TC14AddPriorityAttribute()
        {
            userActions.LogConsoleMessage(TestContext.CurrentContext.Test.MethodName!);
            userActions.LogConsoleMessage("Set Up : ");

            //try
            //{
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
            RemoveAttribute();
            //}catch(Exception ex)
            //{
            //    userActions.LogConsoleMessage(ex.ToString());

            //}
        }

        [Test]
        public void TC15AddPlacmentAttribute()
        {
            userActions.LogConsoleMessage(TestContext.CurrentContext.Test.MethodName!);
            userActions.LogConsoleMessage("Set Up : ");

            //try
            //{
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

            userActions.LogConsoleMessage("Clean up: Delete the attribute ");
            RemoveAttribute();
            //}catch(Exception ex)
            //{
            //    userActions.LogConsoleMessage(ex.ToString());
            //}
        }

        //[Test]
        private void RemoveAttribute()
        {

            Actions actions = new Actions(driver);
            actions.Pause(TimeSpan.FromSeconds(1)).Build().Perform();
            actions.MoveToElement(Attributes.AttributeNameHeading.FindElement(driver)).
            Pause(TimeSpan.FromSeconds(1)).Build().Perform();

            //Click on the edit pencil symbol
            IWebElement editAttribute = driver.FindElement(By.XPath("(//*[local-name()='svg' and @data-icon='pencil-alt'])[1]"));

            actions.MoveToElement(editAttribute)
            .Pause(TimeSpan.FromSeconds(1))
                .Click(editAttribute).Build().Perform();

            actions.Pause(TimeSpan.FromSeconds(1)).Build().Perform();

            actions.MoveToElement(Attributes.RemoveAttribButton.FindElement(driver))
            .Pause(TimeSpan.FromSeconds(1))
                .Click(Attributes.RemoveAttribButton.FindElement(driver)).Build().Perform();


            actions.Pause(TimeSpan.FromSeconds(1)).Build().Perform();
        }
    }
}
