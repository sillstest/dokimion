import React from "react";
import { Routes, Route, useParams } from "react-router-dom";
import TestCases from "../testcases/TestCases";
import TestSuites from "../testsuites/TestSuites";
import Projects from "../projects/Projects";
import ProjectForm from "../projects/ProjectForm";
import Project from "../projects/Project";
import OrganizationForm from "../organizations/OrganizationForm";
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
import ChangeProfile from "../user/ChangeProfile";
import Users from "../user/Users";
import CreateUser from "../user/CreateUser";
import DeleteUser from "../user/DeleteUser";
import OrgSelect from "../user/OrgSelect";
import Events from "../audit/Events";
import Redirect from "../common/Redirect";
import ForgotPassword from "../user/ForgotPassword";

// Wrapper needed for the one route that builds requestUrl from a dynamic param.
function ChangeProfileRedirectRoute() {
  const { login } = useParams();
  return <Redirect requestUrl={"user/change-profile-redirect?login=" + (login || "")} />;
}
function Main({ onProjectChange, onSessionChange }) {



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

          <Route path="/orgselect" element={<OrgSelect onSessionChange={onSessionChange} />} />
          <Route path="/organizations/new" element={<OrganizationForm />} />
          <Route path="/organizations/edit" element={<OrganizationForm editCurrent="true" />} />

          <Route path="/auth" element={<Auth />} />
          <Route path="/idpauth" element={<IdpAuth onSessionChange={onSessionChange} />} />

          <Route path="/user/create-redirect" element={<Redirect requestUrl={"user/create-redirect"} />} />
          <Route path="/user/all-users-redirect" element={<Redirect requestUrl={"user/all-redirect"} />} />
          <Route path="/user/change-profile-redirect/:login" element={<ChangeProfileRedirectRoute />} />

          <Route path="/user/create" element={<CreateUser />} />
          <Route path="/user/" element={<Users onProjectChange={onProjectChange} />} />
          <Route path="/user/delete" element={<DeleteUser />} />

          <Route path="/user/profile/:profileId" element={<Profile />} />
          {/* changepass — legacy path kept for compatibility */}
          <Route path="/user/changepass/:profileId" element={<ChangeProfile />} />

          <Route
            path="/login"
            element={
              <Login
                onProjectChange={onProjectChange}
                onSessionChange={onSessionChange}
              />
            }
          />
          <Route path="/forgot_password" element={<ForgotPassword />} />

          <Route
            path="/:project/testcases/new"
            element={<TestCaseForm onProjectChange={onProjectChange} />}
          />
          <Route
            path="/projects/:project"
            element={<Project onProjectChange={onProjectChange} />}
          />
          <Route
            path="/projects/:project/settings"
            element={
              <ProjectSettings
                onProjectChange={onProjectChange}
                onSessionChange={onSessionChange}
              />
            }
          />
          <Route
            path="/:project/testcase/:testcase"
            element={
              <TestCase
                onProjectChange={onProjectChange}
                onSessionChange={onSessionChange}
              />
            }
          />
          <Route
            path="/:project/testcases"
            element={<TestCases onProjectChange={onProjectChange} />}
          />
          <Route
            path="/:project/testsuites"
            element={<TestSuites onProjectChange={onProjectChange} />}
          />
          <Route
            path="/:project/launches/"
            element={<Launches onProjectChange={onProjectChange} />}
          />
          <Route
            path="/:project/launches/statistics/"
            element={<LaunchesStatistics onProjectChange={onProjectChange} />}
          />
          <Route
            path="/:project/launches/heatmap/"
            element={<LaunchTestcasesHeatmap onProjectChange={onProjectChange} />}
          />
          <Route
            path="/:project/launch/:launchId/:testcaseUuid?"
            element={<Launch onProjectChange={onProjectChange} />}
          />
          <Route
            path="/:project/attributes"
            element={<Attributes onProjectChange={onProjectChange} />}
          />
          <Route
            path="/:project/audit"
            element={<Events onProjectChange={onProjectChange} />}
          />
        </Routes>
      </main>
    );
}

export default Main;
