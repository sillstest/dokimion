using Dokimion.Pages;
using Boa.Constrictor.Screenplay;
using Boa.Constrictor.Selenium;


namespace Dokimion.Interactions
{
    public class LoginUser :ITask
    {
        public string Name { get; }
        public string Password { get; }

        // nginx rate-limits requests; under fast automated runs the login POST can return 429
        // ("Too Many Requests"), which the app surfaces in the login error popup. Retry the submit a
        // few times, backing off so nginx's rate-limit bucket refills. The backoff only happens when a
        // 429 actually occurs, so it doesn't slow the common (successful) path.
        private const int MaxAttempts = 5;
        private const int BackoffMillis = 8000;

        private LoginUser(string name, string password) {
            this.Name = name;
            this.Password = password;
            }

        public static LoginUser For(string name, string password ) =>
          new LoginUser(name, password);

        public void PerformAs(IActor actor)
        {
            UserActions userActions = new UserActions();

            for (int attempt = 1; attempt <= MaxAttempts; attempt++)
            {
                actor.WaitsUntil(Appearance.Of(LoginPage.NameInput), IsEqualTo.True(), timeout: 30);
                actor.AttemptsTo(Clear.On(LoginPage.NameInput));
                actor.AttemptsTo(SendKeys.To(LoginPage.NameInput, Name));

                actor.WaitsUntil(Appearance.Of(LoginPage.PasswordInput), IsEqualTo.True(), timeout: 30);
                actor.AttemptsTo(Clear.On(LoginPage.PasswordInput));
                actor.AttemptsTo(SendKeys.To(LoginPage.PasswordInput, Password));

                // The Sign in button stays disabled until Cloudflare Turnstile issues a token; wait for
                // it to be enabled (token ready) before clicking, otherwise the click is a no-op.
                actor.WaitsUntil(EnabledState.Of(LoginPage.SingInButton), IsEqualTo.True(), timeout: 30);
                actor.AttemptsTo(Click.On(LoginPage.SingInButton));

                // Poll briefly for the outcome:
                //   - login page gone  -> navigated away = success
                //   - popup text "429" -> rate-limited; back off and re-submit
                //   - any other popup  -> e.g. "Unauthorized" (TC2 invalid login); let the caller assert
                // NOTE: ControlledPopup always renders <div class="popup-content"> (even empty), so we
                // must inspect its TEXT, not its presence.
                bool rateLimited = false;
                for (int i = 0; i < 20; i++)   // ~10s
                {
                    bool onLoginPage;
                    try { onLoginPage = actor.AsksFor(Appearance.Of(LoginPage.NameInput)); }
                    catch { onLoginPage = true; }   // mid-navigation node churn -> treat as still here
                    if (!onLoginPage) return;       // navigated away -> login succeeded

                    string msg = "";
                    try { msg = actor.AsksFor(Text.Of(LoginPage.ErrorMessageLocator)) ?? ""; }
                    catch { msg = ""; }

                    if (msg.Contains("429") || msg.Contains("Too Many Requests")) { rateLimited = true; break; }
                    if (msg.Contains("Unauthorized")) return;   // bad creds (expected by TC2) -> stop

                    System.Threading.Thread.Sleep(500);
                }

                if (!rateLimited) return;   // no clear 429 outcome -> don't loop

                userActions.LogConsoleMessage(
                    $"LoginUser: 429 Too Many Requests for '{Name}', backing off {BackoffMillis}ms (attempt {attempt}/{MaxAttempts})");
                System.Threading.Thread.Sleep(BackoffMillis);
                // Next loop re-enters creds and re-submits. The Turnstile widget reset on the prior submit,
                // so a fresh token is issued and the Sign in button re-enables.
            }
        }

    }
}
