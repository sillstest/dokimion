import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCogs } from "@fortawesome/free-solid-svg-icons";
import { FadeLoader } from "react-spinners";
import Backend from "../services/backend";
import ControlledPopup from "../common/ControlledPopup";

function Projects() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    Backend.get("project")
      .then(response => { setProjects(response); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  return (
    <div className="container">
      <ControlledPopup popupMessage={errorMessage} />
      <div className="sweet-loading">
        <FadeLoader size={100} color={"#135f38"} loading={loading} />
      </div>
      {projects.length === 0 && (
        <div className="alert alert-light center-text" role="alert">
          You do not have any projects yet <br />
          Ask your admin to grant you permission to access a project.
        </div>
      )}
      {projects.map(project => (
        <div className="card project-card" key={project.id}>
          <div className="card-header">
            <span><Link to={"/projects/" + project.id}>{project.name}</Link></span>
            <span className="float-right">
              <Link to={"/projects/" + project.id + "/settings"}><FontAwesomeIcon icon={faCogs} /></Link>
            </span>
          </div>
          <div className="card-body">
            <p className="card-text">{project.description || ""}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

export default Projects;
