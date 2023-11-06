using Boa.Constrictor.Screenplay;
using Boa.Constrictor.Selenium;
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
            actor.WaitsUntil(ValueAttribute.Of(Attributes.AttributeName), ContainsSubstring.Text(this.Name), timeout: 45);


            int totalNum = Values.Count;

            Actions actions = new Actions(driver);
            actions.Pause(TimeSpan.FromSeconds(1)).Build().Perform();

            for (int i = 0; i < totalNum; i++)
            {
                var attribValueLocator = $"//input[@name='value' and @index='{i}']";
                actor.WaitsUntil(Appearance.Of(Attributes.AddAttributeValueButton), IsEqualTo.True(), timeout: 45);

                actor.AttemptsTo(Click.On(Attributes.AddAttributeValueButton));
                
                IWebLocator attribLocator = new WebLocator($"AttribLocator{i}", By.XPath(attribValueLocator));

                actor.WaitsUntil(Appearance.Of(attribLocator),IsEqualTo.True(), timeout:60);
                actor.AttemptsTo(Clear.On(attribLocator));
                actor.AttemptsTo(SendKeys.To(attribLocator, Values.ElementAt(i)));
                actor.WaitsUntil(ValueAttribute.Of(attribLocator), ContainsSubstring.Text(Values.ElementAt(i)), timeout: 60);


            }
            Attributes.SaveAttribute.FindElement(driver).Click();
            
        }
    }
}
