import React, { useState, useEffect, useRef } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faMinusCircle } from "../common/icons";
import $ from "jquery";
import ControlledPopup from "../common/ControlledPopup";
import Backend, { getApiBaseUrl } from "../services/backend";
require("popper.js/dist/umd/popper.min.js");
require("bootstrap-fileinput/css/fileinput.min.css");
require("bootstrap-fileinput/js/fileinput.min.js");
require("bootstrap-icons/font/bootstrap-icons.css");

function Attachments({ testcase, projectId, readonly, testDeveloper, onTestcaseUpdated }) {
  const [errorMessage, setErrorMessage] = useState("");
  const attachmentToRemove = useRef(null);

  useEffect(() => {
    if (!projectId || !testcase?.id) return;
    $("#file-data").fileinput("destroy");
    $("#file-data").fileinput({
      previewFileType: "any",
      uploadUrl: getApiBaseUrl(projectId + "/testcase/" + testcase.id + "/attachment"),
      maxFileSize: 100000,
    });
    $("#file-data").on("fileuploaded", () => {
      if (onTestcaseUpdated) onTestcaseUpdated();
    });
    // onTestcaseUpdated is a callback prop; excluded to avoid re-init of the uploader on its identity.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [testcase, projectId]);

  function removeAttachmentConfirmation(attachmentId) {
    attachmentToRemove.current = attachmentId;
    $("#remove-attachment-confirmation").modal("show");
  }

  function cancelRemoveAttachmentConfirmation() {
    attachmentToRemove.current = null;
    $("#remove-attachment-confirmation").modal("hide");
  }

  function removeAttachment() {
    Backend.delete(projectId + "/testcase/" + testcase.id + "/attachment/" + attachmentToRemove.current)
      .then(() => {
        attachmentToRemove.current = null;
        $("#remove-attachment-confirmation").modal("hide");
        if (onTestcaseUpdated) onTestcaseUpdated();
      })
      .catch(() => setErrorMessage("Couldn't remove attachment"));
  }

  return (
    <div>
      <ControlledPopup popupMessage={errorMessage} />
      <div id="files" className="attachments-list">
        {(testcase?.attachments || []).map(attachment => (
          <div key={attachment.id} className="row">
            <div className="col-sm-11">
              <a
                href={getApiBaseUrl("") + projectId + "/testcase/" + testcase.id + "/attachment/" + attachment.id}
                target="_blank"
                rel="noreferrer"
              >
                {attachment.title}
              </a>
            </div>
            {!(readonly || testDeveloper) && (
              <div className="col-sm-1">
                <span
                  className="clickable edit-icon-visible red"
                  onClick={() => removeAttachmentConfirmation(attachment.id)}
                >
                  <FontAwesomeIcon icon={faMinusCircle} />
                </span>
              </div>
            )}
          </div>
        ))}
      </div>
      {!readonly && (
        <div>
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
        </div>
      )}
      <div className="modal fade" tabIndex="-1" role="dialog" id="remove-attachment-confirmation">
        <div className="modal-dialog" role="document">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">Remove Attachment</h5>
              <button type="button" className="close" onClick={cancelRemoveAttachmentConfirmation} aria-label="Close">
                <span aria-hidden="true">&times;</span>
              </button>
            </div>
            <div className="modal-body">Are you sure you want to remove attachment?</div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={cancelRemoveAttachmentConfirmation}>
                Close
              </button>
              <button type="button" className="btn btn-danger" onClick={removeAttachment}>
                Remove Attachment
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Attachments;
