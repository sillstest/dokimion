import React, { Component } from "react";
import { Routes, Route, useParams } from "react-router-dom";
import TestCases from "../testcases/TestCases";
import TestSuites from "../testsuites/TestSuites";
import Projects from "../projects/Projects";
import ProjectForm from "../projects/ProjectForm";
import Project from "../projects/Project";
import ProjectSettings from "../projects/ProjectSettings";
import Launches from "../launches/Launches";
import Launch from "../launches/Launch";
import LaunchesStatistics from "../launches/LaunchesStatistics";
import LaunchTestcasesHeatmap from "../launches/LaunchTestcasesHeatmap";
import Attributes from "../attributes/Attributes";
import TestCaseForm from "../testcases/TestCaseForm";
import TestCase from "../testcases/TestCase";
import Auth from "../user/Auth";
import IdpAuth from "../user/IdpAuth";
import Login from "../user/Login";
import Profile from "../user/Profile";
import ChangePassword from "../user/ChangePassword";
import Users from "../user/Users";
import CreateUser from "../user/CreateUser";
import DeleteUser from "../user/DeleteUser";
import OrgSelect from "../user/OrgSelect";
import Events from "../audit/Events";
import Redirect from "../common/Redirect";
import ForgotPassword from "../user/ForgotPassword";

// Wrapper components to handle params in v6
const RedirectWithParams = ({ requestUrl }) => {
  const params = useParams();
  const login = params.login || "";
  const finalUrl = requestUrl.includes("?") 
    ? requestUrl.replace(":login", login)
    : requestUrl;
  return <Redirect requestUrl={finalUrl} />;
};

class Main extends Component {
  onProjectChange(project) {
    this.props.onProjectChange(project);
  }

  onSessionChange(session) {
    this.props.onSessionChange(session);
  }

  render() {
    return (
      <main>
        <div className="row justify-content-end">
          <div className="alert alert-success alert-message col-4" id="success-alert">
            <span id="success-message-text"></span>
          </div>
          <div className="alert alert-danger alert-message col-4" id="error-alert">
            <span id="error-message-text"></span>
          </div>
        </div>

        <Routes>
          <Route path="/" element={<Projects />} />
          <Route path="/projects" element={<Projects />} />
          <Route path="/projects/new" element={<ProjectForm />} />

          <Route 
            path="/orgselect"
            element={<OrgSelect onSessionChange={this.onSessionChange.bind(this)} />}
          />

          <Route path="/auth" element={<Auth />} />
          <Route
            path="/idpauth"
            element={<IdpAuth onSessionChange={this.onSessionChange.bind(this)} />}
          />

          <Route
            path="/user/create-redirect"
            element={<Redirect requestUrl="user/create-redirect" />}
          />

          <Route
            path="/user/all-users-redirect"
            element={<Redirect requestUrl="user/all-redirect" />}
          />
          <Route
            path="/user/change-password-redirect/:login"
            element={<RedirectWithParams requestUrl="user/change-password-redirect?login=:login" />}
          />

          <Route path="/user/create" element={<CreateUser />} />
          <Route
            path="/user/"
            element={<Users onProjectChange={this.onProjectChange.bind(this)} />}
          />

          <Route path="/user/delete" element={<DeleteUser />} />

          <Route path="/user/profile/:profileId" element={<Profile />} />
          <Route path="/user/changepass/:profileId" element={<ChangePassword />} />

          <Route
            path="/login"
            element={
              <Login
                onProjectChange={this.onProjectChange.bind(this)}
                onSessionChange={this.onSessionChange.bind(this)}
              />
            }
          />
          <Route
            path="/forgot_password"
            element={<ForgotPassword />}
          />
          <Route
            path="/:project/testcases/new"
            element={<TestCaseForm onProjectChange={this.onProjectChange.bind(this)} />}
          />
          <Route
            path="/projects/:project"
            element={<Project onProjectChange={this.onProjectChange.bind(this)} />}
          />
          <Route
            path="/projects/:project/settings"
            element={
              <ProjectSettings 
                onProjectChange={this.onProjectChange.bind(this)}
                onSessionChange={this.onSessionChange.bind(this)}
              />
            }
          />
          <Route
            path="/:project/testcase/:testcase"
            element={
              <TestCase 
                onProjectChange={this.onProjectChange.bind(this)} 
                onSessionChange={this.onSessionChange.bind(this)} 
              />
            }
          />
          <Route
            path="/:project/testcases"
            element={<TestCases onProjectChange={this.onProjectChange.bind(this)} />}
          />
          <Route
            path="/:project/testsuites"
            element={<TestSuites onProjectChange={this.onProjectChange.bind(this)} />}
          />
          <Route
            path="/:project/launches/"
            element={<Launches onProjectChange={this.onProjectChange.bind(this)} />}
          />
          <Route
            path="/:project/launches/statistics/"
            element={<LaunchesStatistics onProjectChange={this.onProjectChange.bind(this)} />}
          />
          <Route
            path="/:project/launches/heatmap/"
            element={<LaunchTestcasesHeatmap onProjectChange={this.onProjectChange.bind(this)} />}
          />
          <Route
            path="/:project/launch/:launchId"
            element={<Launch onProjectChange={this.onProjectChange.bind(this)} />}
          />
          <Route
            path="/:project/launch/:launchId/:testcaseUuid"
            element={<Launch onProjectChange={this.onProjectChange.bind(this)} />}
          />
          <Route
            path="/:project/attributes"
            element={<Attributes onProjectChange={this.onProjectChange.bind(this)} />}
          />
          <Route
            path="/:project/audit"
            element={<Events onProjectChange={this.onProjectChange.bind(this)} />}
          />
        </Routes>
      </main>
    );
  }
}

export default Main;
