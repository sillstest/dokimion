import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import * as Utils from "../common/Utils";
import Backend from "../services/backend";
import ControlledPopup from "../common/ControlledPopup";

export default function ProjectForm({ id }) {
  const navigate = useNavigate();

  const [project, setProject] = useState({
    id: null,
    name: "",
    description: "",
    allowedGroups: [],
    scratchpad: "text",
  });

  const [errorMessage, setErrorMessage] = useState("");

  /* -------------------- helpers -------------------- */

  const normalizeId = (value) => {
    return value
      .trim()
      .toLowerCase()
      .replace(/[^a-zA-Z0-9]/g, "");
  };

  /* -------------------- handlers -------------------- */

  const handleChange = (event) => {
    const { name, value } = event.target;

    setProject((prev) => {
      const updated = { ...prev, [name]: value };

      if (name === "name") {
        updated.id = normalizeId(value);
      }

      return updated;
    });
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    Backend.post("project", project)
      .then((response) => {
        navigate("/projects/" + response.id);
      })
      .catch((error) => {
        setErrorMessage(
          "handleSubmit::Couldn't save project, error: " + error
        );
      });
  };

  /* -------------------- lifecycle -------------------- */

  useEffect(() => {
    if (!id) return;

    Backend.get("project/" + id)
      .then((response) => {
        setProject(response);
      })
      .catch((error) => {
        setErrorMessage(
          "componentDidMount::Couldn't get project, error: " + error
        );
      });
  }, [id]);

  /* -------------------- render -------------------- */

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
            <input
              type="text"
              name="name"
              className="form-control"
              value={project.name}
              onChange={handleChange}
            />
          </div>
        </div>

        <div className="form-group row">
          <label className="col-sm-3 col-form-label">Project ID</label>
          <div className="col-sm-9">
            <input
              type="text"
              name="id"
              className="form-control"
              value={project.id || ""}
              onChange={handleChange}
            />
          </div>
        </div>

        <div className="form-group row">
          <label className="col-sm-3 col-form-label">Description</label>
          <div className="col-sm-9">
            <input
              type="text"
              name="description"
              className="form-control"
              value={project.description}
              onChange={handleChange}
            />
          </div>
        </div>

        <div className="project-form-block">
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleSubmit}
          >
            Create
          </button>
        </div>
      </form>
    </div>
  );
}

