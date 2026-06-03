import React, { useState, useEffect } from "react";
import ControlledPopup from "../common/ControlledPopup";
import { FadeLoader } from "react-spinners";
import Backend from "../services/backend";
import URLForm from "../projects/URLForm";

function ProjectScratchpadWidget({ projectId }) {
  const [project, setProject] = useState({ id: null, name: "", description: "", allowedGroups: [], scratchpadURLs: [] });
  const [session, setSession] = useState({ person: {} });
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    Backend.get("user/session")
      .then(response => setSession(response))
      .catch(() => console.log("Unable to fetch session"));
  }, []);

  useEffect(() => {
    if (!projectId) return;
    Backend.get("project/" + projectId)
      .then(response => setProject(response))
      .catch(error => setErrorMessage("Couldn't get project: " + error));
  }, [projectId]);

  function canEdit() {
    const roles = (session.person.roles || []);
    return roles.includes("ADMIN") || roles.includes("TESTDEVELOPER");
  }

  function saveProject(updatedProject) {
    Backend.put("project", updatedProject)
      .then(response => setProject(response))
      .catch(error => setErrorMessage("Couldn't save project: " + error));
  }

  function onURLAdded(url) {
    if (!canEdit()) { setErrorMessage("Unable to add url"); return; }
    const updated = { ...project, scratchpadURLs: [...(project.scratchpadURLs || []), url] };
    saveProject(updated);
  }

  function onURLRemoved(url) {
    if (!canEdit()) { setErrorMessage("Unable to remove url"); return; }
    const updated = { ...project, scratchpadURLs: (project.scratchpadURLs || []).filter(u => u !== url) };
    saveProject(updated);
  }

  return (
    <div>
      <ControlledPopup popupMessage={errorMessage} />
      <div className="sweet-loading">
        <FadeLoader size={100} color={"#135f38"} loading={loading} />
      </div>
      <table cellSpacing="1">
        <thead>
          <tr>
            <th scope="col">URL Link</th>
            <th scope="col">Remove</th>
          </tr>
        </thead>
        <tbody>
          {(project.scratchpadURLs || []).map(url => (
            <tr key={url}>
              <td><a href={url}>{url}</a></td>
              <td>
                <button onClick={() => onURLRemoved(url)}>
                  <i className="bi-trash" aria-hidden="true"></i>
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="attributes-controls">
        <button type="button" className="btn btn-primary" data-toggle="modal" data-target="#editURL">Add</button>
      </div>
      <div className="modal fade" id="editURL" tabIndex="-1" role="dialog" aria-labelledby="editURLLabel" aria-hidden="true">
        <URLForm project={project} onURLAdded={onURLAdded} />
      </div>
    </div>
  );
}

export default ProjectScratchpadWidget;
