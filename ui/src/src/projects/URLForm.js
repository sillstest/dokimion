import React, { useState, useEffect } from "react";
import ControlledPopup from "../common/ControlledPopup";

function URLForm({ project, urlToAdd, onURLAdded }) {
  const [url, setUrl] = useState(urlToAdd || "");
  const [saveButtonClicked, setSaveButtonClicked] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    setUrl(urlToAdd || "");
  }, [project, urlToAdd]);

  function handleAddSave(event) {
    if (!saveButtonClicked) {
      if ((url || "").startsWith("http")) {
        if (onURLAdded) onURLAdded(url);
        setUrl("");
        setSaveButtonClicked(true);
      } else {
        setErrorMessage("Invalid url format");
      }
    }
    event.preventDefault();
  }

  function handleClose(event) {
    setSaveButtonClicked(false);
    setErrorMessage("");
    setUrl("");
    event.preventDefault();
  }

  return (
    <div className="modal-dialog" role="document">
      <ControlledPopup popupMessage={errorMessage} />
      <div className="modal-content">
        <div className="modal-header">
          <h5 className="modal-title" id="editAttributeLabel">
            URL
          </h5>
          <button type="button" className="close" data-dismiss="modal" aria-label="Close" onClick={handleClose}>
            <span aria-hidden="true">&times;</span>
          </button>
        </div>
        <div className="modal-body">
          <div className="form-group row">
            <div className="col-sm-8">
              <input type="text" name="name" className="col-sm-12" value={url} onChange={e => setUrl(e.target.value)} />
            </div>
          </div>
        </div>
        <div className="modal-footer">
          <button type="button" className="btn btn-primary" onClick={handleAddSave}>
            Save
          </button>
          <button type="button" className="btn btn-secondary" data-dismiss="modal" onClick={handleClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

export default URLForm;
