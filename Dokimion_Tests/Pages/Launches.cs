using Boa.Constrictor.Selenium;
using OpenQA.Selenium;
using static Boa.Constrictor.Selenium.WebLocator;

namespace Dokimion.Pages
{
    internal class Launches
    {
        public static IWebLocator SmokeTestLink => L("SmokeTestLink", By.XPath("//table//tr//a[text()='Smoke Test Launch']"));
        public static IWebLocator SmokeTestReRunLink => L("SmokeTestReRunLink", By.XPath("//table//tr//a[text()='Smoke Test Launch Re-Run']"));

        public static IWebLocator LaunchDelete => L("LaunchDelete", By.XPath("//tr//button//i[@class='bi-trash']"));

        public static IWebLocator LaunchCreatedDatePicker => L("LaunchCreatedDatePicker", By.XPath("(//*[local-name()='svg' and contains(@class,'react-date-picker')])[2]"));
        //need to get current date
        public static IWebLocator LaunchFilterButton => L("LaunchFilterButton", By.XPath("//div[contains(@class,'launch-filter')]//button[text()='Filter']"));
        public static IWebLocator LaunchTableRows => L("LaunchTableRows", By.XPath("//table//tbody//tr"));

        public static IWebLocator LaunchTitleInput => L("LaunchTitleInput", By.XPath("//div[contains(@class,'launch-filter')]//input[@id='name']\r\n"));

        public static IWebLocator StatisticsLink => L("StatisticsLink", By.XPath("//div[contains(@class,'launch-filter')]//a[text()='Statistics']"));

        public static IWebLocator OverviewRow1 => L("OverviewRow1", By.XPath("(//div[@id='overview']//table//tbody//tr)[1]//td[1]"));
        public static IWebLocator OverviewRow2 => L("OverviewRow2", By.XPath("(//div[@id='overview']//table//tbody//tr)[2]//td[1]"));
        public static IWebLocator OverviewCharts => L("OverviewCharts", By.XPath("(//*[local-name()='svg']/*[local-name()='text']/*[local-name()='tspan'])"));

        public static IWebLocator HeatMapLink => L("HeatMapLink", By.XPath("//*[@id='heatmap-tab']"));

        public static IWebLocator ToggleButton1 => L("ToggleButton1", By.XPath("(//div[@id='heatmap']//div[contains(@class, 'toggle checkbox')])[1]"));

        public static IWebLocator ToggleLabel1 => L("ToggleInput1", By.XPath("(//div[@id='heatmap']//div[contains(@class, 'toggle checkbox')])[1]/label"));

        public static IWebLocator StatusesGraph => L("StatusesGraph", By.XPath("(//*[local-name()='svg']/*[local-name()='text']/*[local-name()='tspan'])[1]"));
        public static IWebLocator UsersGraph => L("UsersGraph", By.XPath("(//*[local-name()='svg']/*[local-name()='text']/*[local-name()='tspan'])[2]"));
        public static IWebLocator LaunchTrendGraph => L("LaunchTrendGraph", By.XPath("(//*[local-name()='svg']/*[local-name()='text']/*[local-name()='tspan'])[3]"));
        public static IWebLocator LaunchUserExecTrendGraph => L("LaunchUserExecTrendGraph", By.XPath("(//*[local-name()='svg']/*[local-name()='text']/*[local-name()='tspan'])[4]"));
        public static IWebLocator LaunchDeleteDate => L("LaunchDeleteDate", By.XPath("(//*[local-name()='svg' and contains(@class,'react-date-picker__clear')])[1]"));


    }
}
