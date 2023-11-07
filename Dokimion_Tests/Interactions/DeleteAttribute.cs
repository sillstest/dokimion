using Boa.Constrictor.Screenplay;
using Boa.Constrictor.Selenium;
using Dokimion.Pages;
using OpenQA.Selenium;
using OpenQA.Selenium.Interactions;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Dokimion.Interactions
{
    internal class DeleteAttribute:ITask
    {
        private string AttributeName { get; }
        private DeleteAttribute(string attribName) {
            this.AttributeName = attribName;
        }

        public static DeleteAttribute For(string attribName) => new DeleteAttribute(
            attribName);

        public void PerformAs(IActor Actor)
        {
            string AttributeNameXpath = $"//b[text()='{AttributeName}']";
            IWebLocator AttributeNameHeading = new WebLocator("AttributeNameHeading", By.XPath(AttributeNameXpath));
            Actor.WaitsUntil(Appearance.Of(AttributeNameHeading), IsEqualTo.True(), timeout: 60);
            Actor.AttemptsTo(Hover.Over(AttributeNameHeading));

            Actor.AttemptsTo(Hover.Over(Attributes.EditAttribSVG));
            Actor.AttemptsTo(Click.On(Attributes.EditAttribSVG));

            Actor.WaitsUntil(Appearance.Of(Attributes.RemoveAttribButton), IsEqualTo.True(), timeout: 60);
            Actor.AttemptsTo(Hover.Over(Attributes.RemoveAttribButton));
            Actor.AttemptsTo(Click.On(Attributes.RemoveAttribButton));

           // Actions actions = new Actions(driver);
        
            Actor.AttemptsTo(Hover.Over(Header.UserInfo));
        }

    }
}
