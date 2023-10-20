using Boa.Constrictor.Selenium;
using OpenQA.Selenium;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using static Boa.Constrictor.Selenium.WebLocator;


namespace Dokimion.Pages
{
    public class Attributes
    {

        public static IWebLocator AddAttributes => L("CreateAttributes", By.XPath("//div[@class ='attributes-controls']//button[normalize-space()='Add']"));

        public static IWebLocator AttributeName => L("AttributeName", By.XPath("//input[@name='name']"));
     
        //button[text()='Add value']
        public static IWebLocator AddAttributeValueButton => L("AddAttributeValueButton", By.XPath("//button[text()='Add value']"));
        //button[text()='Save changes']

        public static IWebLocator SaveAttribute => L("AddAttributeValueButton", By.XPath("//button[text()='Save changes']"));

        //b[contains(text(),'Functionality')]
        public static IWebLocator FunctionalityAttrib => L("FunctionalityAttrib", By.XPath("//b[contains(text(),'Functionality')]"));

        public static IWebLocator RemoveAttribButton => L("RemoveAttribButton", By.XPath("//button[@class='btn btn-danger float-right' and text()='Remove']"));

        //Generic b for deleting the attribute
        public static IWebLocator AttributeNameHeading => L("AttributeNameHeading", By.XPath ("(//b)[1]"));

        //p[@class='mb-0']
        public static IWebLocator VerifyAttributesList => L("VerifyAttributesList", By.XPath("//p[@class='mb-0']"));

        public static IWebLocator PriorityAttrib => L("PriorityAttrib", By.XPath("//b[contains(text(),'Priority')]"));

        public static IWebLocator PlacementAttrib => L("PlacementAttrib", By.XPath("//b[contains(text(),'Placement')]"));


    }
}
