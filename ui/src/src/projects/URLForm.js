import React, { useEffect, useState } from "react";
import ControlledPopup from "../common/ControlledPopup";
import Backend from "../services/backend";

export default function URLForm({
  project,
  url: initialUrl,
  onURLAdded,
}) {
  const [url, setUrl] = useState(initialUrl || "");
  const [session, setSession] = useState({ person: {} });
  const [saveButtonClicked, setSaveButtonClicked] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  /* -------------------- lifecycle -------------------- */

  useEffect(() => {
    Backend.get("user/session")
      .then(setSession)
      .catch(() => console.log("Unable to fetch session"));
  }, []);

  useEffect(() => {
    setUrl(initialUrl || "");
  }, [initialUrl]);

  /* -------------------- handlers -------------------- */

  const handleChange = (event) => {
    setUrl(event.target.value);
  };

  const handleAddSave = (event) => {
    event.preventDefault();

    if (saveButtonClicked) return;

    if (url.startsWith("http")) {
      onURLAdded(url);
      setUrl("");
      setSaveButtonClicked(true);
    } else {
      setErrorMessage("handleAddSave::Invalid url format");
    }
  };

  const handleClose = (event) => {
    event.preventDefault();
    setSaveButtonClicked(false);
    setErrorMessage("");
    setUrl("");
  };

  /* -------------------- render -------------------- */

  return (
    <div className="modal-dialog" role="document">
      <ControlledPopup popupMessage={errorMessage} />

      <div className="modal-content">
        <div className="modal-header">
          <h5 className="modal-title">URL</h5>
          <button
            type="button"
            className="close"
            data-dismiss="modal"
            aria-label="Close"
            onClick={handleClose}
          >
            <span aria-hidden="true">&times;</span>
          </button>
        </div>

        <div className="modal-body">
          <div className="form-group row">
            <div className="col-sm-8">
              <input
                type="text"
                className="col-sm-12"
                value={url}
                onChange={handleChange}
              />
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleAddSave}
          >
            Save
          </button>
          <button
            type="button"
            className="btn btn-secondary"
            data-dismiss="modal"
            onClick={handleClose}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

