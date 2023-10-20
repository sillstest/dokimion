using Boa.Constrictor.Selenium;
using OpenQA.Selenium;
using static Boa.Constrictor.Selenium.WebLocator;

namespace Dokimion.Pages
{
    public class TestCases
    {
        public static IWebLocator AddTestCase => L(
                    "Add TestCase",
                    By.XPath("//button[@title='Add Testcase']"));

        public static IWebLocator TestCaseName => L(
                    "TestCaseName",
                    By.XPath("//body/div[@id='root']/div[1]/div[1]/main[1]/div[2]/div[3]/div[1]/div[1]/div[2]/div[2]/form[1]/div[1]/div[1]/input[1]"));

        public static IWebLocator TestCaseDescription => L(
                    "TestCaseName", By.XPath("//body/div[@id='root']/div[1]/div[1]/main[1]/div[2]/div[3]/div[1]/div[1]/div[2]/div[2]/form[1]/div[2]/div[1]/input[1]"));

        public static IWebLocator SaveTestCaseButton => L(
                  "TestCaseName", By.XPath("//button[contains(text(),'Save changes')]"));

        public static IWebLocator GetTestCaseName => L(
                         "TestCaseName", By.XPath("(//span[@data-role='display'])[1]"));

        public static IWebLocator RemoveTestCase => L("RemoveTestCase", By.XPath("//*[@id='testCase']/div/div[3]/a"));

        public static IWebLocator RemoveTestCaseButton => L("RemoveTestCaseButton", By.XPath("//body//div[@class='modal-footer']//a[contains(text(),'Remove Testcase')]"));

        public static IWebLocator AddStepButton => L("AddStepButton",
            By.XPath("//button[normalize-space()='Add Step']"));

        public static IWebLocator RichTextEditIframeLocator => L(
                   "Rich Text Area",
                  By.XPath(".//iframe[@title='Rich Text Area']"));


        public static IWebLocator StepsContent => L("StepsContent", By.TagName("p"));
        public static IWebLocator ExpectationContent => L("ExpectationContent", By.TagName("p"));

        
        public static IWebLocator SaveStep1 => L("SaveStep1", By.XPath("//div[@id='steps-0-form']//button[@type='button'][normalize-space()='Save']"));


        //steps-1-form
        public static IWebLocator SaveStep2 => L("SaveStep2", By.XPath("//div[@id='steps-1-form']//button[@type='button'][normalize-space()='Save']"));

        public static IWebLocator EditStep2Expectations => L("EditStep2Expectations", By.XPath("//div[@id='steps-1-display']//a[@class='card-link'][normalize-space()='Edit']\r\n"));

        

        public static IWebLocator Step1Text => L("Step1Text", By.XPath("//p[normalize-space()='Go to Quack home page']"));
        public static IWebLocator Step2Text => L("Step1Text", By.XPath("//p[normalize-space()='Login as admin']"));

        public static IWebLocator Expectation2Text => L("Step1Text", By.XPath("//p[normalize-space()='List of projects opens']"));

        
        public static IWebLocator RichTextBody => L("RichTextBody", By.TagName("p"));

        public static IWebLocator RemoveStep1 => L("RemoveStep1", By.XPath("//div[@id='steps-0-display']//a[@type='button' and text()='Remove']"));

        public static IWebLocator RemoveStep1Confirm => L("RemoveStep1Confirm", By.XPath("//div[@id='steps-0-display']//div[@class='modal-header']//h5"));

        //div[@id='steps-0-display']//div[@class='modal-footer']//a
        //div[@class = 'modal-footer']//a[contains(text(),'Remove')]
        public static IWebLocator FinalRemoveStep1 => L("FinalRemoveStep1", By.XPath("//div[@id='steps-0-display']//div[@class = 'modal-footer']//a[contains(text(),'Remove')]"));

        public static IWebLocator Preconditions => L("Preconditions",By.XPath("//h5[normalize-space()='Preconditions']//span[@class='edit edit-icon clickable']//*[name()='svg']"));
        //div[@id='preconditions-form']//button[@type='button'][normalize-space()='Save']

        public static IWebLocator SavePreconditions => L("SavePreconditions", By.XPath("//div[@id='preconditions-form']//button[@type='button'][normalize-space()='Save']"));
        //*[@id="preconditions-display"]/p
        public static IWebLocator PreconditionsText => L("PreconditionsText", By.XPath("//*[@id='preconditions-display']/p"));



        public static IWebLocator AddAttributeButtonTC => L("AddAttributeButtonTC", By.XPath("//button[text()='Add Attribute']"));
        public static IWebLocator AttributeNameTC => L("AttributeNameTC", By.XPath("//div[@id='attributes']//div[contains(@class,'placeholder') and text()='Select...']"));

        public static IWebLocator AttributeValueTC => L("AttributeValueTC", By.XPath("//div[@id='attributes']//div[@class='card-body']//div[contains(@class,'placeholder') and text()='Select...']\r\n"));
        public static IWebLocator AttributeSaveTC => L("AttributeSaveTC", By.XPath("//div[@id='attributes']//div[@class='card-body']//button[text()='Save']"));

        public static IWebLocator AttributeDivTC => L("AttributeDivTC", By.XPath("//div[@id='attributes']//div[@class='inplace-form']//div[@class='card-body']"));



    }

}
