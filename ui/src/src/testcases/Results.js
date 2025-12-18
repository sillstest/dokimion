import React, { useEffect, useRef, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faMinusCircle } from "@fortawesome/free-solid-svg-icons";
import $ from "jquery";
import ControlledPopup from "../common/ControlledPopup";
import Backend, { getApiBaseUrl } from "../services/backend";

require("popper.js/dist/umd/popper.min.js");
require("bootstrap-fileinput/css/fileinput.min.css");
require("bootstrap-fileinput/js/fileinput.min.js");
require("bootstrap-icons/font/bootstrap-icons.css");

export default function Results({ projectId, testcase, onTestcaseUpdated }) {
  const resultToRemoveRef = useRef(null);

  const [currentProjectId, setCurrentProjectId] = useState(projectId);
  const [currentTestcase, setCurrentTestcase] = useState(testcase || { results: [] });
  const [errorMessage, setErrorMessage] = useState("");

  /* -------------------- sync props -------------------- */

  useEffect(() => {
    if (projectId) setCurrentProjectId(projectId);
  }, [projectId]);

  useEffect(() => {
    if (testcase) setCurrentTestcase(testcase);
  }, [testcase]);

  /* -------------------- fileinput init -------------------- */

  useEffect(() => {
    if (!currentProjectId || !currentTestcase?.id) return;

    $("#file-data").fileinput("destroy");
    $("#file-data").fileinput({
      previewFileType: "any",
      uploadUrl: getApiBaseUrl(
        `${currentProjectId}/testcase/${currentTestcase.id}/result`
      ),
      maxFileSize: 100000,
    });

    $("#file-data").on("fileuploaded", () => {
      onTestcaseUpdated && onTestcaseUpdated();
    });

    return () => {
      $("#file-data").fileinput("destroy");
    };
  }, [currentProjectId, currentTestcase?.id]);

  /* -------------------- remove result -------------------- */

  const removeResultConfirmation = (resultId) => {
    resultToRemoveRef.current = resultId;
    $("#remove-result-confirmation").modal("show");
  };

  const cancelRemoveResultConfirmation = () => {
    resultToRemoveRef.current = null;
    $("#remove-result-confirmation").modal("hide");
  };

  const removeResult = () => {
    const resultId = resultToRemoveRef.current;
    if (!resultId) return;

    Backend.delete(
      `${currentProjectId}/testcase/${currentTestcase.id}/result/${resultId}`
    )
      .then(() => {
        resultToRemoveRef.current = null;
        $("#remove-result-confirmation").modal("hide");

        setCurrentTestcase((prev) => ({
          ...prev,
          results: (prev.results || []).filter((r) => r.id !== resultId),
        }));

        onTestcaseUpdated && onTestcaseUpdated();
      })
      .catch((error) =>
        setErrorMessage(
          "removeResult::Couldn't remove result, error: " + error
        )
      );
  };

  /* -------------------- render helpers -------------------- */

  const renderResult = (result) => (
    <div className="row" key={result.id}>
      <div className="col-sm-11">
        <a
          href={
            getApiBaseUrl("") +
            currentProjectId +
            "/testcase/" +
            currentTestcase.id +
            "/result/" +
            result.id
          }
          target="_blank"
          rel="noreferrer"
        >
          {result.title}
        </a>
      </div>
      <div className="col-sm-1">
        <span
          className="clickable edit-icon-visible red"
          onClick={() => removeResultConfirmation(result.id)}
        >
          <FontAwesomeIcon icon={faMinusCircle} />
        </span>
      </div>
    </div>
  );

  /* -------------------- render -------------------- */

  return (
    <div>
      <ControlledPopup popupMessage={errorMessage} />

      <div id="files" className="results-list">
        {(currentTestcase.results || []).map(renderResult)}
      </div>

      <form id="file-form" encType="multipart/form-data">
        <div className="file-loading">
          <input
            id="file-data"
            className="file"
            type="file"
            name="file"
            multiple
            data-min-file-count="0"
            data-theme="fas"
          />
        </div>
        <br />
      </form>

      {/* Remove confirmation modal */}
      <div
        className="modal fade"
        tabIndex="-1"
        role="dialog"
        id="remove-result-confirmation"
      >
        <div className="modal-dialog" role="document">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">Remove Result</h5>
              <button
                type="button"
                className="close"
                onClick={cancelRemoveResultConfirmation}
                aria-label="Close"
              >
                <span aria-hidden="true">&times;</span>
              </button>
            </div>

            <div className="modal-body">
              Are you sure you want to remove result?
            </div>

            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={cancelRemoveResultConfirmation}
              >
                Close
              </button>
              <button
                type="button"
                className="btn btn-danger"
                onClick={removeResult}
              >
                Remove Result
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

