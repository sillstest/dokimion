import React, { useState, useEffect, useCallback } from "react";
import TestSuitesWidget from "../testsuites/TestSuitesWidget";
import ProjectScratchpadWidget from "../projects/ProjectScratchpadWidget";
import LaunchesWidget from "../launches/LaunchesWidget";
import LaunchesTrendWidget from "../launches/LaunchesTrendWidget";
import { Link, useParams } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCogs } from "@fortawesome/free-solid-svg-icons";
import Backend from "../services/backend";
import ControlledPopup from "../common/ControlledPopup";
import { FadeLoader } from "react-spinners";

const Project = ({ onProjectChange }) => {
  const { project: projectId } = useParams();

  const [project, setProject] = useState({
    id: null,
    name: "",
    description: "",
    allowedGroups: [],
    scratchpad: "",
  });

  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  const getProject = useCallback(() => {
    if (!projectId) return;

    Backend.get("project/" + projectId)
      .then((response) => {
        setProject(response);
        setLoading(false);
      })
      .catch((error) => {
        setErrorMessage("getProject::Couldn't get project, error: " + error);
        setLoading(false);
      });
  }, [projectId]);

  const handleChange = (event) => {
    // Implementation placeholder
  };

  const handleSubmit = (event) => {
    // Implementation placeholder
  };

  // Initial load and project ID changes
  useEffect(() => {
    if (projectId) {
      setProject((prev) => ({ ...prev, id: projectId }));
      if (onProjectChange) {
        onProjectChange(projectId);
      }
      getProject();
    }
  }, [projectId, onProjectChange, getProject]);

  return (
    <div>
      <ControlledPopup popupMessage={errorMessage} />
      <div className="project-header">
        <h1 className="project-name">{project.name}</h1>
        <Link
          to={"/projects/" + project.id + "/settings"}
          className="project-settings-link"
        >
          <FontAwesomeIcon icon={faCogs} />
        </Link>
      </div>
      <div className="row">
        <div className="col-sm-6">
          <div className="card project-card">
            <div className="card-header">
              <span>
                <Link to={"/" + project.id + "/launches"}>Launches</Link>
              </span>
            </div>
            <div className="card-body">
              <LaunchesWidget limit={5} projectId={project.id} />
            </div>
          </div>
        </div>
        <div className="col-sm-6">
          <div className="card project-card">
            <div className="card-header">
              <span>
                <Link to={"/" + project.id + "/testsuites"}>Test Suites</Link>
              </span>
            </div>
            <div className="card-body">
              <TestSuitesWidget limit={11} projectId={project.id} />
            </div>
          </div>
        </div>
      </div>
      <div className="row">
        <div className="col-6">
          <div className="card project-card">
            <div className="card-header">
              <span>
                <Link to={"/" + project.id + "/launches"}>
                  Last 20 Launches
                </Link>
              </span>
            </div>
            <div className="card-body">
              <LaunchesTrendWidget projectId={project.id} />
            </div>
          </div>
        </div>
        <div className="col-sm-6">
          <div className="card project-card">
            <div className="card-header">
              <span>
                <Link to={"/" + project.id + "/projectscratchpad"}></Link>
              </span>
            </div>
            <div className="card-body">
              <ProjectScratchpadWidget limit={11} projectId={project.id} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Project;
