import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import * as UserSession from "../user/UserSession";
import * as Utils from "../common/Utils";
import Backend from "../services/backend";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCheck } from "@fortawesome/free-solid-svg-icons";
import { Helmet } from "react-helmet";

const Header = (props) => {
  const navigate = useNavigate();

  const emptyState = {
    person: { firstName: "Guest" },
    metainfo: { analyticsEnabled: false }
  };

  const [session, setSession] = useState(props.session || emptyState);
  const [projects, setProjects] = useState([]);
  const [projectId, setProjectId] = useState(null);
  const [projectName, setProjectName] = useState(null);

  // Handle session change
  const onSessionChange = (newSession) => {
    if (newSession && newSession.person) {
      UserSession.getSession().login = newSession.person.id;
      UserSession.getSession().name = newSession.person.name;
      UserSession.getSession().isAdmin = newSession.isAdmin;
      UserSession.getSession().roles = newSession.person.roles;
      UserSession.getSession().groups = newSession.person.groups;
      UserSession.getSession().permissions = newSession.person.permissions;
    }
    props.onSessionChange(newSession);
  };

  // Change organization
  const changeOrganization = (organizationId) => {
    Backend.post("user/changeorg/" + organizationId)
      .then(response => {
        onSessionChange(response);
        window.location = "/";
      })
      .catch(error => {
        console.log("Unable to change organization");
      });
  };

  // Get project details
  const getProject = (id) => {
    Backend.get("project/" + id).then(response => {
      setProjectName(response.name);
      setProjectId(response.id);
    });
  };

  // Log out
  const logOut = () => {
    Backend.delete("user/logout")
      .then(() => {
        setSession(emptyState);
        onSessionChange(emptyState);
        navigate("/auth");
      })
      .catch(error => console.log(error));
  };

  // Component mount effect
  useEffect(() => {
    Backend.postPlain("user/init")
      .then(response => {
        console.log("Initialized UserResource");
      })
      .catch(error => {
        console.log("Unable to initialize UserResource: " + error);
      });

    Backend.get("user/session")
      .then(response => {
        if (session.id !== response.id) {
          setSession(response);
          onSessionChange(response);
          if (
            response.person.defaultPassword &&
            !window.location.pathname.includes("/user/change-password-redirect") &&
            !window.location.pathname.includes("/user/changepass")
          ) {
            navigate("/user/change-password-redirect/" + response.person.login);
          }
        }
      })
      .catch(() => {
        console.log("Unable to fetch session");
      });

    Backend.get("project?includedFields=name,description,id,readWriteUsers")
      .then(response => {
        setProjects(response);
      })
      .catch(() => {});
  }, []);

  // Update from props - session
  useEffect(() => {
    if (props.session && session.id !== props.session.id) {
      setSession(props.session);
    }
  }, [props.session]);

  // Update from props - project
  useEffect(() => {
    if (props.project && projectId !== props.project) {
      setProjectId(props.project);
      getProject(props.project);
    }
  }, [props.project]);

  // Render projects dropdown
  const renderProjects = () => {
    return (
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
            <Link className="dropdown-item " to="/projects">
              All
            </Link>
            {projects.map(function (project) {
              return (
                <Link to={"/projects/" + project.id} key={project.id} className="dropdown-item">
                  {project.name}
                </Link>
              );
            })}
            {Utils.isUserOwnerOrAdmin(session) && (
              <div>
                <hr />
                <Link to={"/projects/new"} className="dropdown-item">
                  Create Project
                </Link>
              </div>
            )}
          </div>
        </li>
      </ul>
    );
  };

  let profileContext;
  if (session.id) {
    profileContext = (
      <span>
        <div>
          <a className="dropdown-item" href={"/user/profile/" + session.person.login}>
            Profile
          </a>
        </div>

        {Utils.isUserOwnerOrAdmin(session) && (
          <div>
            <div className="dropdown-divider"></div>
            <a className="dropdown-item" href={"/user/all-users-redirect"}>
              All Users
            </a>
            <a className="dropdown-item" href={"/user/create-redirect"}>
              Create User
            </a>
            <a className="dropdown-item" href={"/user/delete"}>
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

  return (
    <>
      {session.person !== undefined && session.person.firstName !== "Guest" ? (
        /* only display banner when user is logged in */
        <nav className="navbar navbar-expand-md navbar-dark bg-green">
          {/* Google analytics*/}
          {session.metainfo && session.metainfo.analyticsEnabled && (
            <Helmet>
              <script async src="https://www.googletagmanager.com/gtag/js?id=G-4CEVX7JVR7"></script>
            </Helmet>
          )}
          {session.metainfo && session.metainfo.analyticsEnabled && (
            <Helmet
              script={[{
                type: 'text/javascript',
                innerHTML: "window.dataLayer = window.dataLayer || []; function gtag(){dataLayer.push(arguments);} gtag('js', new Date()); gtag('config', 'G-4CEVX7JVR7');"
              }]}
            />
          )}

          <button type="button" className="navbar-toggler" data-toggle="collapse" data-target="#navbarNav">
            <span className="navbar-toggler-icon"></span>
          </button>
          <div className="collapse navbar-collapse" id="navbarNav" style={{ display: 'flex', justifyContent: 'space-between' }}>
            {/* Wrapped left side items in a flex container */}
            <div style={{ display: 'flex' }}>
              {renderProjects()}
              {!props.project && <ul className="navbar-nav mr-auto"></ul>}
              {props.project && (
                <ul className="navbar-nav mr-auto">
                  <li className="nav-item">
                    <Link className="nav-link" to={"/" + props.project + "/testcases"}>
                      TestCases
                    </Link>
                  </li>
                  <li className="nav-item">
                    <Link className="nav-link" to={"/" + props.project + "/launches"}>
                      Launches
                    </Link>
                  </li>
                  {(session.person.roles != null && session.person.roles[0] !== "OBSERVERONLY") &&
                    <li className="nav-item">
                      <Link className="nav-link" to={"/" + props.project + "/testsuites"}>
                        Suites
                      </Link>
                    </li>
                  }
                  {Utils.isAdmin(session) &&
                    <li className="nav-item">
                      <Link className="nav-link" to={"/" + props.project + "/attributes"}>
                        Attributes
                      </Link>
                    </li>
                  }
                </ul>
              )}
            </div>
            <ul className="navbar-nav ml-auto">
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
};

export default Header;
