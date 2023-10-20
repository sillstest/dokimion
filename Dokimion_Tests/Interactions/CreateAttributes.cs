using Boa.Constrictor.Screenplay;
using Boa.Constrictor.Selenium;
using Dokimion;
using Dokimion.Pages;
using OpenQA.Selenium;
using OpenQA.Selenium.Interactions;

namespace Dokimion.Interactions
{
    internal class CreateAttributes : ITask
    {

        public IWebDriver driver;
        public string Name { get; }
        public List<string> Values { get; }

        private CreateAttributes(string name, List<string> values, IWebDriver driver)
        {
            this.Name = name;
            this.Values = values;
            this.driver = driver;
        }

        public static CreateAttributes For(string name, List<string> values, IWebDriver driver) =>
          new CreateAttributes(name, values, driver);


        public void PerformAs(IActor actor)
        {

            actor.WaitsUntil(Appearance.Of(Attributes.AttributeName), IsEqualTo.True(), timeout: 60);
            actor.AttemptsTo(Clear.On(Attributes.AttributeName));

            actor.AttemptsTo(SendKeys.To(Attributes.AttributeName, this.Name));

            int totalNum = Values.Count;
           // Console.WriteLine("In the Perform Task : " + totalNum);

            Actions actions = new Actions(driver);
            actions.Pause(TimeSpan.FromSeconds(1)).Build().Perform();

            for (int i = 0; i < totalNum; i++)
            {
             //   Console.WriteLine("Why so many add ? " + i);
                var attribValueLocator = $"//input[@name='value' and @index='{i}']";
                actor.AttemptsTo(Click.On(Attributes.AddAttributeValueButton));

                IWebElement attribLocator = driver.FindElement(By.XPath(
                   attribValueLocator));

                attribLocator.Clear();
                attribLocator.SendKeys(Values.ElementAt(i));
                //actor.WaitsUntil(Appearance.Of(),IsEqualTo.True());
                //actor.AttemptsTo(SendKeys.To(attribLocator, Values.ElementAt(i) ));

            }
            Attributes.SaveAttribute.FindElement(driver).Click();
            actions.Pause(TimeSpan.FromSeconds(1)).Build().Perform();

        }
    }
}
