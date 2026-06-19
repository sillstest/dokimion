/* eslint-disable jsx-a11y/alt-text */
/* eslint-disable jsx-a11y/role-supports-aria-props */
/* eslint-disable jsx-a11y/anchor-is-valid */
/* eslint-disable eqeqeq */
import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { withRouter } from "./withRouter";
import * as UserSession from "../user/UserSession";
import * as Utils from "../common/Utils";
import Backend from "../services/backend";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCheck } from "@fortawesome/free-solid-svg-icons";
import { Helmet } from "react-helmet-async";

const emptySession = { person: { firstName: "Guest" }, metainfo: { analyticsEnabled: false } };

function Header({ session: sessionProp, project, onSessionChange, history }) {
  const [session, setSession] = useState(sessionProp || emptySession);
  const [projects, setProjects] = useState([]);
  const [projectName, setProjectName] = useState("");
  const [, setProjectId] = useState(null);

  function handleSessionChange(s) {
    if (s && s.person) {
      UserSession.getSession().login = s.person.id;
      UserSession.getSession().name = s.person.name;
      UserSession.getSession().isAdmin = s.isAdmin;
      UserSession.getSession().roles = s.person.roles;
      UserSession.getSession().groups = s.person.groups;
      UserSession.getSession().permissions = s.person.permissions;
    }
    if (onSessionChange) onSessionChange(s);
  }

  useEffect(() => {
    Backend.postPlain("user/init")
      .then(() => console.log("Initialized UserResource"))
      .catch(error => console.log("Unable to initialize UserResource: " + error));

    Backend.get("user/session")
      .then(response => {
        setSession(prev => {
          if (prev.id !== response.id) {
            handleSessionChange(response);
            if (
              response.person.defaultPassword &&
              !window.location.pathname.includes("/user/change-profile-redirect") &&
              !window.location.pathname.includes("/user/changepass")
            ) {
              history.push("/user/change-profile-redirect/" + response.person.login);
            } else if (
              response.metainfo.organizationsEnabled &&
              !response.metainfo.currentOrganization &&
              window.location.pathname != "/orgselect" &&
              window.location.pathname != "/organizations/new"
            ) {
              history.push("/orgselect");
            }
          }
          return response;
        });
      })
      .catch(() => console.log("Unable to fetch session"));

    Backend.get("project?includedFields=name,description,id,readWriteUsers")
      .then(response => setProjects(response))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (sessionProp) setSession(sessionProp);
  }, [sessionProp]);

  useEffect(() => {
    if (!project) return;
    setProjectId(project);
    Backend.get("project/" + project)
      .then(response => {
        setProjectName(response.name);
        setProjectId(response.id);
      })
      .catch(error => console.log("Couldn't get project: " + error));
  }, [project]);

  function changeOrganization(organizationId) {
    Backend.post("user/changeorg/" + organizationId)
      .then(response => {
        handleSessionChange(response);
        window.location = "/";
      })
      .catch(() => console.log("Unable to change organization"));
  }

  function logOut() {
    Backend.delete("user/logout")
      .then(() => {
        setSession(emptySession);
        handleSessionChange(emptySession);
        history.push("/auth");
      })
      .catch(error => console.log(error));
  }

  let profileContext;
  if (session.id) {
    profileContext = (
      <span>
        {(!session.metainfo || !session.metainfo.organizationsEnabled) && (
          <div>
            <a className="dropdown-item" href={"/user/profile/" + session.person.login}>
              Profile
            </a>
          </div>
        )}
        {session.metainfo && session.metainfo.organizationsEnabled && (
          <div>
            {(session.metainfo.organizations || []).map((organization, index) => (
              <div key={index} className="clickable dropdown-item" onClick={() => changeOrganization(organization.id)}>
                {organization.name}
                {session.metainfo.currentOrganization === organization.id && (
                  <span>
                    {" "}
                    <FontAwesomeIcon icon={faCheck} />
                  </span>
                )}
              </div>
            ))}
            <div className="dropdown-divider"></div>
            <Link className="dropdown-item" to="/organizations/edit">
              Edit Current Organization
            </Link>
            <Link className="dropdown-item" to="/organizations/new">
              Create New Organization
            </Link>
          </div>
        )}
        {Utils.isUserOwnerOrAdmin(session) && (!session.metainfo || !session.metainfo.organizationsEnabled) && (
          <div>
            <div className="dropdown-divider"></div>
            <a className="dropdown-item" href="/user/all-users-redirect">
              All Users
            </a>
            <a className="dropdown-item" href="/user/create-redirect">
              Create User
            </a>
            <a className="dropdown-item" href="/user/delete">
              Delete User
            </a>
          </div>
        )}
        <div className="dropdown-divider"></div>
        <a className="dropdown-item" href="#" onClick={logOut}>
          Log out
        </a>
      </span>
    );
  } else {
    profileContext = (
      <a className="dropdown-item active" href="/auth">
        Login
      </a>
    );
  }

  const isLoggedIn = session.person !== undefined && session.person.firstName !== "Guest";

  return (
    <>
      {isLoggedIn ? (
        <nav className="navbar navbar-expand-md navbar-dark bg-green">
          {session.metainfo && session.metainfo.analyticsEnabled && (
            <Helmet>
              <script async src="https://www.googletagmanager.com/gtag/js?id=G-4CEVX7JVR7"></script>
            </Helmet>
          )}
          {session.metainfo && session.metainfo.analyticsEnabled && (
            <Helmet
              script={[
                {
                  type: "text/javascript",
                  innerHTML:
                    "window.dataLayer = window.dataLayer || []; function gtag(){dataLayer.push(arguments);} gtag('js', new Date()); gtag('config', 'G-4CEVX7JVR7');",
                },
              ]}
            />
          )}

          <button type="button" className="navbar-toggler" data-toggle="collapse" data-target="#navbarNav">
            <span className="navbar-toggler-icon"></span>
          </button>
          <div className="collapse navbar-collapse" id="navbarNav">
            {/* Projects dropdown */}
            <ul className="navbar-nav">
              <li className="nav-item dropdown">
                <a
                  className="nav-item nav-link dropdown-toggle mr-md-2"
                  href="#"
                  id="bd-projects"
                  data-toggle="dropdown"
                  aria-haspopup="true"
                  aria-expanded="false"
                >
                  {projectName || "Projects"}
                </a>
                <div className="dropdown-menu dropdown-menu-left" aria-labelledby="bd-projects">
                  <Link className="dropdown-item" to="/projects">
                    All
                  </Link>
                  {projects.map(p => (
                    <Link to={"/projects/" + p.id} key={p.id} className="dropdown-item">
                      {p.name}
                    </Link>
                  ))}
                  {Utils.isUserOwnerOrAdmin(session) && (
                    <div>
                      <hr />
                      <Link to="/projects/new" className="dropdown-item">
                        Create Project
                      </Link>
                    </div>
                  )}
                </div>
              </li>
            </ul>

            {/* Project nav links */}
            {!project && <ul className="navbar-nav mr-auto"></ul>}
            {project && (
              <ul className="navbar-nav mr-auto">
                <li className="nav-item">
                  <Link className="nav-link" to={"/" + project + "/testcases"}>
                    TestCases
                  </Link>
                </li>
                <li className="nav-item">
                  <Link className="nav-link" to={"/" + project + "/launches"}>
                    Launches
                  </Link>
                </li>
                {session.person.roles != null && session.person.roles[0] != "OBSERVERONLY" && (
                  <li className="nav-item">
                    <Link className="nav-link" to={"/" + project + "/testsuites"}>
                      Suites
                    </Link>
                  </li>
                )}
                {Utils.isAdmin(session) && (
                  <li className="nav-item">
                    <Link className="nav-link" to={"/" + project + "/attributes"}>
                      Attributes
                    </Link>
                  </li>
                )}
              </ul>
            )}

            {/* User dropdown */}
            <ul className="navbar-nav">
              <li className="nav-item dropdown">
                <a
                  className="nav-item nav-link dropdown-toggle mr-md-2"
                  href="#"
                  id="bd-login"
                  data-toggle="dropdown"
                  aria-haspopup="true"
                  aria-expanded="false"
                >
                  {session.person.firstName || ""} {session.person.lastName || ""}
                </a>
                <div className="dropdown-menu dropdown-menu-right" aria-labelledby="bd-login">
                  {profileContext}
                </div>
              </li>
            </ul>
          </div>
        </nav>
      ) : (
        <nav style={{ height: 60 }} className="navbar navbar-expand-md navbar-dark bg-green" />
      )}
    </>
  );
}

export default withRouter(Header);
