import React, { useState, useEffect } from "react";
import { withRouter } from "../common/withRouter";
import Backend from "../services/backend";
import ControlledPopup from "../common/ControlledPopup";

function normalizeId(id) {
  return id.trim().toLowerCase().replace(/[^a-zA-Z0-9]/g, "");
}

function ProjectForm({ id, history }) {
  const [project, setProject] = useState({
    id: null, name: "", description: "", allowedGroups: [], scratchpad: "text",
  });
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (id) {
      Backend.get("project/" + id)
        .then(response => setProject(response))
        .catch(error => setErrorMessage("Couldn't get project: " + error));
    }
  }, [id]);

  function handleChange(event) {
    const updated = { ...project, [event.target.name]: event.target.value };
    if (event.target.name === "name") updated.id = normalizeId(event.target.value);
    setProject(updated);
  }

  function handleSubmit(event) {
    Backend.post("project", project)
      .then(response => history.push("/projects/" + response.id))
      .catch(error => setErrorMessage("Couldn't save project: " + error));
    event.preventDefault();
  }

  return (
    <div className="project-form">
      <ControlledPopup popupMessage={errorMessage} />
      <div className="project-form-title">
        <h1>Create Project</h1>
      </div>
      <form>
        <div className="form-group row">
          <label className="col-sm-3 col-form-label">Name</label>
          <div className="col-sm-9">
            <input type="text" name="name" className="form-control" value={project.name} onChange={handleChange} />
          </div>
        </div>
        <div className="form-group row">
          <label className="col-sm-3 col-form-label">Project ID</label>
          <div className="col-sm-9">
            <input type="text" name="id" className="form-control" value={project.id || ""} onChange={handleChange} />
          </div>
        </div>
        <div className="form-group row">
          <label className="col-sm-3 col-form-label">Description</label>
          <div className="col-sm-9">
            <input type="text" name="description" className="form-control" value={project.description} onChange={handleChange} />
          </div>
        </div>
        <div className="project-form-block">
          <button type="button" className="btn btn-primary" onClick={handleSubmit}>
            Create
          </button>
        </div>
      </form>
    </div>
  );
}

export default withRouter(ProjectForm);
