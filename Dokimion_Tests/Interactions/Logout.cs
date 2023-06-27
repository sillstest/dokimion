using Dokimion.Pages;
using Boa.Constrictor.Screenplay;
using Boa.Constrictor.Selenium;

namespace Dokimion.Interactions
{
    internal class Logout : ITask
    {

        private Logout() { }
     
        public static Logout For() => new Logout();

        public void PerformAs(IActor actor)
        {
            actor.WaitsUntil(Appearance.Of(Header.UserInfo), IsEqualTo.True(), timeout:60);
            actor.AttemptsTo(Click.On(Header.UserInfo));

            actor.WaitsUntil(Appearance.Of(Header.LogoutLink), IsEqualTo.True(), timeout: 60);
            actor.AttemptsTo(Click.On(Header.LogoutLink));
        }
    }
}
