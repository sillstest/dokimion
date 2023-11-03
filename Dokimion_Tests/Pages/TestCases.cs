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

        public static IWebLocator RemoveTestCase => L("RemoveTestCase", By.XPath("(//*[@id='testCase']//a[text()='Remove Testcase'])[1]"));
            //By.XPath("//*[@id='testCase']/div/div[3]/a"));

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
     
        public static IWebLocator FinalRemoveStep1 => L("FinalRemoveStep1", By.XPath("//div[@id='steps-0-display']//div[@class = 'modal-footer']//a[contains(text(),'Remove')]"));

        public static IWebLocator Preconditions => L("Preconditions",By.XPath("//h5[normalize-space()='Preconditions']//span[@class='edit edit-icon clickable']//*[name()='svg']"));

        public static IWebLocator SavePreconditions => L("SavePreconditions", By.XPath("//div[@id='preconditions-form']//button[@type='button'][normalize-space()='Save']"));
        public static IWebLocator PreconditionsText => L("PreconditionsText", By.XPath("//*[@id='preconditions-display']/p"));

        public static IWebLocator AddAttributeButtonTC => L("AddAttributeButtonTC", By.XPath("//button[text()='Add Attribute']"));
        public static IWebLocator AttributeNameTC => L("AttributeNameTC", By.XPath("//div[@id='attributes']//div[contains(@class,'placeholder') and text()='Select...']"));

        public static IWebLocator AttributeValueTC => L("AttributeValueTC", By.XPath("//div[@id='attributes']//div[@class='card-body']//div[contains(@class,'placeholder') and text()='Select...']\r\n"));
        public static IWebLocator AttributeSaveTC => L("AttributeSaveTC", By.XPath("//div[@id='attributes']//div[@class='card-body']//button[text()='Save']"));

        public static IWebLocator AttributeDivTC => L("AttributeDivTC", By.XPath("//div[@id='attributes']//div[@class='inplace-form']//div[@class='card-body']"));

        public static IWebLocator GroupingSelect => L("GroupingSelect", By.XPath("(//div[contains(@class,'placeholder') and text()='Select...'])[1]"));

        public static IWebLocator GroupingDropDown => L("GroupingDropDown", By.XPath("//div[@class='row filter-control-row']//div[contains(@id,'react-select')]"));
        public static IWebLocator FilterLocator => L("FilterLocator", By.XPath("//*[local-name()='svg' and @data-icon='filter']"));
        
        public static IWebLocator GroupAfterFirstSelect => L("GroupAfterFirstSelect", By.XPath("//div[@class='css-1szy77t-control']"));

        public static IWebLocator Filter1Locator => L("Filter1_Locator", By.XPath("//div[contains(@class,'filter-attribute-id-select')]"));

        public static IWebLocator Filter1AttributeLocator => L("Filter1AttributeLocator", By.XPath("(//div[@class='css-11unzgr']//div[contains(@id,'react-select')])[4]"));

        public static IWebLocator Filter1Selector => L("Filter1Selector", By.XPath("(//div[contains(@class,'placeholder') and text()='Select...'])[1]"));

        public static IWebLocator Filter1AttribValue => L("Filter1AttribValue", By.XPath("//div[contains(@class,'filter-attribute-val-select')]//div[contains(@id,'react-select')][1]"));

        public static IWebLocator Filter2Locator => L("Filter2Locator", By.XPath("(//div[contains(@class,'filter-attribute-id-select')])[2]"));

        public static IWebLocator Filter2AttributeLocator => L("Filter2AttributeLocator", By.XPath("(//div[@class='css-11unzgr']//div[contains(@id,'react-select')])[3]"));

        public static IWebLocator Filter2Selector => L("Filter2Selector", By.XPath("(//div[contains(@class,'placeholder') and text()='Select...'])[1]"));

        public static IWebLocator Filter2AttribValue => L("Filter2AttribValue", By.XPath("//div[contains(@class,'filter-attribute-val-select')]//div[contains(@id,'react-select')][1]"));


        public static IWebLocator TestCaseTreeListMain => L("TestCaseTreeListMain", By.XPath("//ul[@class='gj-list gj-list-bootstrap']/*"));

        //li[contains(@data-id,'Authentication')]//i[contains(@class,'gj-icon')] - 3 depth
        public static IWebLocator GroupingTreeDepthAuth => L("GroupingTreeDepthAuth", By.XPath("//li[contains(@data-id,'Authentication')]//i[contains(@class,'gj-icon')]"));


        public static IWebLocator AuthenticationGroupTC => L("AuthenticationGroupTC", By.XPath("//li[contains(@data-id,'Authentication')]//span[@data-role='display']//b[text()='Authentication']"));

        public static IWebLocator ValidateLoginGroupTC => L("ValidateLoginGroupTC", By.XPath("//li[contains(@data-id,'Authentication')]//span[@data-role='display' and text()='Validate login']"));

        public static IWebLocator HeaderProjectListGroupTC => L("HeaderProjectListGroupTC", By.XPath("//li[contains(@data-id,'Projects')]//span[@data-role='display' and text()='Header project list validation']"));
        public static IWebLocator SaveSuiteLocator => L("SaveSuiteLocator", By.XPath("//*[local-name()='svg' and @data-icon='save']"));

        public static IWebLocator SuiteNameInput => L("SuiteNameInput", By.XPath("//div[@id='suite-modal']//input[@name='name']"));

        public static IWebLocator SuiteSaveButton => L("SuiteSaveButton", By.XPath("//div[@id='suite-modal']//div[@class='modal-footer']//button[text()='Save']"));

        public static IWebLocator SuiteRemoveIcon => L("SuiteRemoveIcon", By.XPath("//*[local-name()='svg' and @data-icon='minus-circle']"));

        public static IWebLocator SuiteRemoveConfirmButton => L("SuiteRemoveConfirmButton", By.XPath("//div[@id='remove-testsuite-confirmation']//button[text()='Remove Test Suite']"));


        public static IWebLocator SuiteNameHeading => L("SuiteNameHeading", By.XPath("//div[contains(@class,'testsuite-card')]//h5[text()='Smoke Test']"));

        public static IWebLocator SuiteViewLink => L("SuiteViewLink", By.XPath("//div[contains(@class,'testsuite-card')]//a[text()='View']"));

        public static IWebLocator LaunchSaveButton => L("LaunchSaveButton", By.XPath("//button[@title='Launch Tescases']"));

        public static IWebLocator LaunchNameInput => L("LaunchNameInput", By.XPath("//div[@id='launch-creation-form']//input[@name='name']"));

        public static IWebLocator LaunchCreateButton => L("LaunchCreateButton", By.XPath("//div[@id='launch-modal']//button[text()='Create Launch']"));

        public static IWebLocator GoToLaunchLink => L("GoToLaunchLink", By.XPath("//div[@id='launch-modal']//a[text()='Go To Launch']"));

        public static IWebLocator SmokeTestLaunchTitle => L("SmokeTestLaunchTitle", By.XPath("//main//a[text()='Smoke Test Launch']"));

        //Add testcase
        public static IWebLocator AddTestcaseLocator => L("AddTestcaseLocator", By.XPath("//li[contains(@data-id,'TestCase')]//span[@data-role='display' and text()='Add testcase']"));

        public static IWebLocator LaunchStartButton => L("LaunchStartButton", By.XPath("//div[@class='launch-status-controls']//button[text()='Start']"));

        public static IWebLocator LaunchPassButton => L("LaunchPassButton", By.XPath("//div[@class='launch-status-controls']//button[text()='Pass']"));
        public static IWebLocator LaunchFailButton => L("LaunchFailButton", By.XPath("//div[@class='launch-status-controls']//button[text()='Fail']"));
        public static IWebLocator LaunchBrokenButton => L("LaunchBrokenButton", By.XPath("//div[@class='launch-status-controls']//button[text()='Broken']"));
        public static IWebLocator LaunchSkipButton => L("LaunchSkipButton", By.XPath("//div[@class='launch-status-controls']//button[text()='Skip']"));
        public static IWebLocator LaunchXButton => L("LaunchXButton", By.XPath("//div[@class='launch-status-controls']//button[text()='X']"));

        public static IWebLocator LaunchFailMessage => L("LaunchFailMessage", By.XPath("//div[@id='fail-dialog']//textarea[@id='failure-text']"));

        public static IWebLocator LaunchFailMsgButton => L("LaunchFailMsgButton", By.XPath("//div[@id='fail-dialog']//button[text()='Fail']"));

        public static IWebLocator LaunchCreationTC => L("LaunchCreationTC", By.XPath("//li[contains(@data-id,'Launch')]//span[@data-role='display' and text()='Launch creation']"));

        public static IWebLocator LaunchBrokenMessage => L("LaunchBrokenMessage", By.XPath("//div[@id='broken-dialog']//textarea[@id='failure-text']"));

        public static IWebLocator LaunchBrokenMsgButton => L("LaunchBrokenMsgButton", By.XPath("//div[@id='broken-dialog']//button[text()='Mark as Broken']"));

        public static IWebLocator LaunchSkipMessage => L("LaunchSkipMessage", By.XPath("//div[@id='skipped-dialog']//textarea[@id='failure-text']"));

        public static IWebLocator LaunchSkipMsgButton => L("LaunchSkipMessage", By.XPath("//div[@id='skipped-dialog']//button[text()='Skip']"));

        public static IWebLocator LaunchRestartFailButton => L("LaunchRestartFailButton", By.XPath("//div[@id='testCase']//div[@class='restart-launch-control']//button[text()='Restart Failed']"));

        public static IWebLocator LaunchRestartNameInput => L("LaunchRestartNameInput",By.XPath("//div[@id='restart-launch-modal']//input[@name='name']"));
        public static IWebLocator LaunchRestartCreateButton => L("LaunchRestartCreateButton", By.XPath("//div[@id='restart-launch-modal']//div[@class='modal-footer']//button[text()='Create Launch']"));
        public static IWebLocator LaunchRestartGoToLaunch => L("LaunchRestartGoToLaunch", By.XPath("//div[@id='restart-launch-modal']//div[@class='modal-body']//a[text()='Go To Launch']"));
        public static IWebLocator LaunchRestartCloseButton => L("LaunchRestartCloseButton", By.XPath("//div[@id='restart-launch-modal']//div[@class='modal-footer']//button[text()='Close']"));

        public static IWebLocator LaunchRestartModal => L("LaunchRestartModal", By.XPath("//div[@class='modal fade show']"));

        public static IWebLocator FailureLink => L("FailureLink", By.XPath("(//div[@id='testCase']//ul//li)[2]"));

        public static IWebLocator FailureMessage => L("FailureMessage", By.XPath("//div[@id='failure']//div[contains(text(),'wrong')]"));

        public static IWebLocator AuthenticationLaunchStatusIcon => L("AuthenticationLaunchStatusIcon", By.XPath("//li[contains(@data-id,'Authentication')]//ul//span[@data-role='image']/img"));

        public static IWebLocator TestCaseLaunchStatusIcon => L("TestCaseLaunchStatusIcon", By.XPath("//li[contains(@data-id,'TestCase')]//ul//span[@data-role='image']/img"));
        public static IWebLocator ProjectsLaunchStatusIcon => L("ProjectsLaunchStatusIcon", By.XPath("//li[contains(@data-id,'Projects')]//ul//span[@data-role='image']/img"));
        public static IWebLocator LaunchLaunchStatusIcon => L("LaunchLaunchStatusIcon", By.XPath("//li[contains(@data-id,'Launch')]//ul//span[@data-role='image']/img"));

        public static IWebLocator LaunchFailStatusButton => L("LaunchFailStatusButton", By.XPath("//div[@class='launch-status-controls']//button[@role='alert' and text()='FAILED']"));

        public static IWebLocator LaunchPassStatusButton => L("LaunchPassStatusButton", By.XPath("//div[@class='launch-status-controls']//button[@role='alert' and text()='PASSED']"));

        public static IWebLocator LaunchBrokenStatusButton => L("LaunchBrokenStatusButton", By.XPath("//div[@class='launch-status-controls']//button[@role='alert' and text()='BROKEN']"));

        public static IWebLocator LaunchSkippedStatusButton => L("LaunchSkippedStatusButton", By.XPath("//div[@class='launch-status-controls']//button[@role='alert' and text()='SKIPPED']"));

        public static IWebLocator LaunchTestCasesTitle => L("SmokeTestLaunchTitle", By.XPath("//main//a[contains(text(),'Launch')]"));

        public static IWebLocator LaunchTCStatuses => L("LaunchTCStatuses", By.XPath("//li//span[@data-role='image']/img"));

        public static IWebLocator TestSuiteNameOnTC => L("TestSuiteNameOnTC", By.XPath("//main//h2"));

    }

}
