import React, { useState, useEffect, useRef } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faMinusCircle } from "@fortawesome/free-solid-svg-icons";
import $ from "jquery";
import ControlledPopup from "../common/ControlledPopup";
import Backend, { getApiBaseUrl } from "../services/backend";
require("popper.js/dist/umd/popper.min.js");
require("bootstrap-fileinput/css/fileinput.min.css");
require("bootstrap-fileinput/js/fileinput.min.js");
require("bootstrap-icons/font/bootstrap-icons.css");

function Results({ testcase, projectId, onTestcaseUpdated }) {
  const [errorMessage, setErrorMessage] = useState("");
  const resultToRemove = useRef(null);

  useEffect(() => {
    if (!projectId || !testcase?.id) return;
    $("#file-data").fileinput("destroy");
    $("#file-data").fileinput({
      previewFileType: "any",
      uploadUrl: getApiBaseUrl(projectId + "/testcase/" + testcase.id + "/result"),
      maxFileSize: 100000,
    });
    $("#file-data").on("fileuploaded", () => { if (onTestcaseUpdated) onTestcaseUpdated(); });
  }, [testcase, projectId]);

  function removeResultConfirmation(resultId) {
    resultToRemove.current = resultId;
    $("#remove-result-confirmation").modal("show");
  }

  function cancelRemoveResultConfirmation() {
    resultToRemove.current = null;
    $("#remove-result-confirmation").modal("hide");
  }

  function removeResult() {
    Backend.delete(projectId + "/testcase/" + testcase.id + "/result/" + resultToRemove.current)
      .then(() => {
        resultToRemove.current = null;
        $("#remove-result-confirmation").modal("hide");
        if (onTestcaseUpdated) onTestcaseUpdated();
      })
      .catch(error => setErrorMessage("Couldn't remove result: " + error));
  }

  return (
    <div>
      <ControlledPopup popupMessage={errorMessage} />
      <div id="files" className="results-list">
        {(testcase?.results || []).map(result => (
          <div key={result.id} className="row">
            <div className="col-sm-11">
              <a href={getApiBaseUrl("") + projectId + "/testcase/" + testcase.id + "/result/" + result.id} target="_blank" rel="noreferrer">
                {result.title}
              </a>
            </div>
            <div className="col-sm-1">
              <span className="clickable edit-icon-visible red" onClick={() => removeResultConfirmation(result.id)}>
                <FontAwesomeIcon icon={faMinusCircle} />
              </span>
            </div>
          </div>
        ))}
      </div>
      <div>
        <form id="file-form" encType="multipart/form-data">
          <div className="file-loading">
            <input id="file-data" className="file" type="file" name="file" multiple data-min-file-count="0" data-theme="fas" />
          </div>
          <br />
        </form>
      </div>
      <div className="modal fade" tabIndex="-1" role="dialog" id="remove-result-confirmation">
        <div className="modal-dialog" role="document">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">Remove Result</h5>
              <button type="button" className="close" onClick={cancelRemoveResultConfirmation} aria-label="Close">
                <span aria-hidden="true">&times;</span>
              </button>
            </div>
            <div className="modal-body">Are you sure you want to remove result?</div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={cancelRemoveResultConfirmation}>Close</button>
              <button type="button" className="btn btn-danger" onClick={removeResult}>Remove Result</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Results;
