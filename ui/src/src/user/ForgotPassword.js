import React, { useState } from "react";
import { withRouter } from "../common/withRouter";
import Backend from "../services/backend";
import ControlledPopup from "../common/ControlledPopup";

function ForgotPassword() {
  const [login, setLogin] = useState("");
  const [message, setMessage] = useState("");

  function handleSubmit(event) {
    Backend.postPlain("user/forgot_password?login=" + login)
      .then(() => {
        setMessage("Success: Sent temporary password email for login");
        window.location = decodeURI("/");
      })
      .catch(() => setMessage("Error: Unable to retrieve email for login"));
    event.preventDefault();
  }

  return (
    <div className="text-center">
      <ControlledPopup popupMessage={message} />
      <form className="form-signin">
        <h1 className="h3 mb-3 font-weight-normal">Forgot Password</h1>
        <label htmlFor="login" className="sr-only">Login</label>
        <input type="text" id="login" name="login" className="form-control" placeholder="Login" required onChange={e => setLogin(e.target.value)} />
        <button className="btn btn-lg btn-primary btn-block" onClick={handleSubmit}>
          Send Email with Temporary Password
        </button>
      </form>
    </div>
  );
}

export default withRouter(ForgotPassword);
