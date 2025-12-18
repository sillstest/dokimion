import React, { useEffect, useState, useCallback } from "react";
import ControlledPopup from "../common/ControlledPopup";
import { FadeLoader } from "react-spinners";
import Backend from "../services/backend";
import URLForm from "../projects/URLForm";

export default function ProjectScratchpadWidget({ projectId }) {
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const [project, setProject] = useState({
    id: null,
    name: "",
    description: "",
    allowedGroups: [],
    scratchpadURLs: [],
  });

  const [url, setUrl] = useState("");
  const [reRenderAfterRemove, setReRenderAfterRemove] = useState(true);
  const [session, setSession] = useState({ person: {} });

  /* -------------------- helpers -------------------- */

  const hasEditPermission = () => {
    const role = session?.person?.roles?.[0];
    return role === "ADMIN" || role === "TESTDEVELOPER";
  };

  /* -------------------- backend calls -------------------- */

  const getSession = () => {
    Backend.get("user/session")
      .then(setSession)
      .catch(() => console.log("Unable to fetch session"));
  };

  const getProject = () => {
    if (!projectId) return;

    Backend.get("project/" + projectId)
      .then(setProject)
      .catch((error) =>
        setErrorMessage("getProject::Couldn't get project: " + error)
      );
  };

  const saveProject = (updatedProject) => {
    Backend.put("project", updatedProject)
      .then(setProject)
      .catch((error) =>
        setErrorMessage("saveProject::Couldn't save project: " + error)
      );
  };

  /* -------------------- lifecycle -------------------- */

  useEffect(() => {
    getSession();
  }, []);

  useEffect(() => {
    if (projectId) {
      getProject();
    }
  }, [projectId]);

  /* -------------------- handlers -------------------- */

  const onURLAdded = (newUrl) => {
    if (!hasEditPermission()) {
      setErrorMessage("onURLAdded - Unable to add url");
      return;
    }

    setProject((prev) => {
      const updated = {
        ...prev,
        scratchpadURLs: [...(prev.scratchpadURLs || []), newUrl],
      };
      saveProject(updated);
      return updated;
    });

    setUrl("");
  };

  const onURLRemoved = (removedUrl) => {
    if (!hasEditPermission()) {
      setErrorMessage("onURLRemoved - Unable to remove url");
      return;
    }

    setProject((prev) => {
      const updated = {
        ...prev,
        scratchpadURLs: prev.scratchpadURLs.filter((u) => u !== removedUrl),
      };
      saveProject(updated);
      return updated;
    });

    setUrl("");
    if (reRenderAfterRemove) {
      setReRenderAfterRemove(false);
    }
  };

  /* -------------------- render -------------------- */

  return (
    <div>
      <ControlledPopup popupMessage={errorMessage} />

      <div className="sweet-loading">
        <FadeLoader
          sizeUnit={"px"}
          size={100}
          color={"#135f38"}
          loading={loading}
        />
      </div>

      <table cellSpacing="1">
        <thead>
          <tr>
            <th scope="col">URL Link</th>
            <th scope="col">Remove</th>
          </tr>
        </thead>
        <tbody>
          {project?.scratchpadURLs?.map((u) => (
            <tr key={u}>
              <td>
                <a href={u}>{u}</a>
              </td>
              <td>
                <button onClick={() => onURLRemoved(u)}>
                  <i className="bi-trash" aria-hidden="true"></i>
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="attributes-controls">
        <button
          type="button"
          className="btn btn-primary"
          data-toggle="modal"
          data-target="#editURL"
        >
          Add
        </button>
      </div>

      <div
        className="modal fade"
        id="editURL"
        tabIndex="-1"
        role="dialog"
        aria-labelledby="editURLLabel"
        aria-hidden="true"
      >
        <URLForm project={project} url={url} onURLAdded={onURLAdded} />
      </div>
    </div>
  );
}

