using Dokimion.Pages;
using Boa.Constrictor.Screenplay;
using Boa.Constrictor.Selenium;


namespace Dokimion.Interactions
{
    public class LoginUser :ITask
    {
        public string Name { get; }
        public string Password { get; }

        private LoginUser(string name, string password) {
            this.Name = name;
            this.Password = password;
            }
   
        public static LoginUser For(string name, string password ) =>
          new LoginUser(name, password);

        public void PerformAs(IActor actor)
        {
            actor.AttemptsTo(Clear.On(LoginPage.NameInput));
            actor.AttemptsTo(SendKeys.To(LoginPage.NameInput, Name));
            actor.AttemptsTo(Clear.On(LoginPage.PasswordInput));
            actor.AttemptsTo(SendKeys.To(LoginPage.PasswordInput,Password));
            actor.AttemptsTo(Click.On(LoginPage.SingInButton));
        }

    }
}
