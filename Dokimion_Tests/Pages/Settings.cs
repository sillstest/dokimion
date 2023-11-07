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
    internal class Settings
    {
        public static IWebLocator DokimionProjectSettingsLink => L("DokimionProjectSettingsLink", By.XPath("(//div[@class='card-header'])[2]/span/child::a"));

        public static IWebLocator EnvironmentInput => L("EnvironmentInput", By.XPath("//*[@id='react-select-4-input']"));

        public static IWebLocator SettingsSaveButton => L("SettingsSaveButton", By.XPath("//div[@class='project-settings-control row']//button[text()='Save']"));

        public static IWebLocator RemoveEnvironments => L("RemoveEnvironments", By.XPath("(//*[local-name()='svg' and @class='css-19bqh2r'])[5]"));
        
        public static IWebLocator EnvironmentList => L("EnvironmentList", By.XPath("(//div[@class='project-settings-section']//div[@class='css-1hwfws3'])[3]/*"));

        public static IWebLocator DisplayMessage => L("DisplayMessage", By.XPath("//div[@class='popup-content']"));

    }
}
