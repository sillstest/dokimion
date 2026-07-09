using Boa.Constrictor.Selenium;
using OpenQA.Selenium;
using static Boa.Constrictor.Selenium.WebLocator;

namespace Dokimion.Pages
{
    // Locators for the project dashboard's settings entry point and the project Settings page.
    // (Named ProjectSettingsPage, not ProjectSettings, to avoid clashing with the ProjectSettings
    // test fixture in Dokimion.Tests.)
    public class ProjectSettingsPage
    {
        // The double-gear (faCogs) icon at the far right of the project title on the project dashboard;
        // it is an <a class="project-title-settings-link"> that links to the project Settings page.
        // (projects/Project.js)
        public static IWebLocator SettingsGear => L("ProjectSettingsGear",
            By.XPath("//a[contains(@class,'project-title-settings-link')]"));

        // "Remove Project" trigger button on the Settings page - a stable "Settings page is loaded"
        // marker. (projects/ProjectSettings.js: the btn-danger with data-target='#remove-project-confirmation')
        public static IWebLocator RemoveProjectButton => L("RemoveProjectButton",
            By.XPath("//button[@data-target='#remove-project-confirmation']"));

        // The settings (double-gear) icon on a project's row in the projects LIST page (Projects.js) -
        // for the project whose card-header name link matches the given name. Links to that project's
        // Settings page. (Distinct from SettingsGear, which is on the single-project dashboard.)
        public static IWebLocator ProjectListSettingsGear(string projectName) => L("ProjectListSettingsGear:" + projectName,
            By.XPath($"//div[@class='card-header'][.//a[normalize-space()='{projectName}']]//a[contains(@href,'/settings')]"));

        // A selected user chip's label in the Users multi-select (e.g. "NormalTester"). Used to verify
        // a user is present in the project's Users list.
        public static IWebLocator UserChip(string label) => L("UserChip:" + label,
            By.XPath($"//label[normalize-space()='Users']/following-sibling::div//div[normalize-space(text())='{label}']"));

        // The Permissions "Users" multi-select (react-select AsyncSelect) to the right of the "Users"
        // label. Click the control to open/focus it, type into its input, then pick the option.
        public static IWebLocator UsersSelectControl => L("UsersSelectControl",
            By.XPath("//label[normalize-space()='Users']/following-sibling::div//div[contains(@class,'-control')]"));

        public static IWebLocator UsersSelectInput => L("UsersSelectInput",
            By.XPath("//label[normalize-space()='Users']/following-sibling::div//input[contains(@id,'react-select')]"));

        // A react-select menu option (in the currently open menu) whose text contains the given value.
        // Option ids are "react-select-<n>-option-<m>", so matching '-option-' avoids depending on the
        // emotion-generated menu class.
        public static IWebLocator UserOption(string text) => L("UserOption:" + text,
            By.XPath($"//div[contains(@id,'react-select') and contains(@id,'-option-') and contains(normalize-space(),'{text}')]"));

        // The "x" remove control on a selected user chip in the Users multi-select. react-select v5
        // renders each chip as a MultiValue with a label div followed by the remove button; the class
        // names are emotion-hashed, so target the label's following-sibling div (the remove button)
        // scoped to the Users control. Used to remove a previously-added user in cleanup.
        public static IWebLocator RemoveUserChipButton(string label) => L("RemoveUserChip:" + label,
            By.XPath($"//label[normalize-space()='Users']/following-sibling::div//div[normalize-space(text())='{label}']/following-sibling::div[1]"));

        // The main "Save" button for the Settings page (btn-success in the project-settings-control row).
        public static IWebLocator SaveSettingsButton => L("SaveSettingsButton",
            By.XPath("//div[contains(@class,'project-settings-control')]//button[normalize-space()='Save']"));

        // ControlledPopup content - shows "Project Settings successfully saved" after a successful save.
        public static IWebLocator SettingsSavedPopup => L("SettingsSavedPopup",
            By.XPath("//div[@class='popup-content']"));
    }
}
