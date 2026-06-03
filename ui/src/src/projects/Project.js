import React, { useState, useEffect } from "react";
import { withRouter } from "../common/withRouter";
import TestSuitesWidget from "../testsuites/TestSuitesWidget";
import ProjectScratchpadWidget from "../projects/ProjectScratchpadWidget";
import LaunchesWidget from "../launches/LaunchesWidget";
import LaunchesTrendWidget from "../launches/LaunchesTrendWidget";
import { Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCogs } from "@fortawesome/free-solid-svg-icons";
import Backend from "../services/backend";
import ControlledPopup from "../common/ControlledPopup";
import { FadeLoader } from "react-spinners";

function Project({ match, onProjectChange }) {
  const projectId = match?.params?.project;
  const [project, setProject] = useState({ id: null, name: "", description: "", allowedGroups: [], scratchpad: "" });
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (!projectId) return;
    if (onProjectChange) onProjectChange(projectId);
    Backend.get("project/" + projectId)
      .then(response => { setProject(response); setLoading(false); })
      .catch(error => { setErrorMessage("Couldn't get project: " + error); setLoading(false); });
  }, [projectId]);

  return (
    <div>
      <ControlledPopup popupMessage={errorMessage} />
      <div className="sweet-loading">
        <FadeLoader size={100} color={"#135f38"} loading={loading} />
      </div>
      <div className="project-header">
        <h1>
          {project.name}
          <span className="float-right">
            <Link to={"/projects/" + project.id + "/settings"} className="project-title-settings-link">
              <FontAwesomeIcon icon={faCogs} />
            </Link>
          </span>
        </h1>
      </div>
      <div className="row">
        <div className="col-sm-6">
          <div className="card project-card">
            <div className="card-header"><Link to={"/" + project.id + "/launches"}>Launches</Link></div>
            <div className="card-body"><LaunchesWidget limit={5} projectId={project.id} /></div>
          </div>
        </div>
        <div className="col-sm-6">
          <div className="card project-card">
            <div className="card-header"><Link to={"/" + project.id + "/testsuites"}>Test Suites</Link></div>
            <div className="card-body"><TestSuitesWidget limit={11} projectId={project.id} /></div>
          </div>
        </div>
      </div>
      <div className="row">
        <div className="col-6">
          <div className="card project-card">
            <div className="card-header"><Link to={"/" + project.id + "/launches"}>Last 20 Launches</Link></div>
            <div className="card-body"><LaunchesTrendWidget projectId={project.id} /></div>
          </div>
        </div>
        <div className="col-sm-6">
          <div className="card project-card">
            <div className="card-header"><span /></div>
            <div className="card-body"><ProjectScratchpadWidget limit={11} projectId={project.id} /></div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default withRouter(Project);
