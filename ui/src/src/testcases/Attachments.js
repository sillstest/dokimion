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

export default function Attachments({
  projectId,
  testcase,
  readonly,
  testDeveloper,
  onTestcaseUpdated,
}) {
  const [currentTestcase, setCurrentTestcase] = useState(testcase);
  const [errorMessage, setErrorMessage] = useState("");
  const attachmentToRemoveRef = useRef(null);

  /* -------------------- sync props -------------------- */

  useEffect(() => {
    if (testcase) {
      setCurrentTestcase(testcase);
    }
  }, [testcase]);

  /* -------------------- fileinput init -------------------- */

  useEffect(() => {
    if (!projectId || !currentTestcase?.id) return;

    $("#file-data").fileinput("destroy");
    $("#file-data").fileinput({
      previewFileType: "any",
      uploadUrl: getApiBaseUrl(
        `${projectId}/testcase/${currentTestcase.id}/attachment`
      ),
      maxFileSize: 100000,
    });

    $("#file-data").on("fileuploaded", () => {
      onTestcaseUpdated && onTestcaseUpdated();
    });

    return () => {
      $("#file-data").fileinput("destroy");
    };
  }, [projectId, currentTestcase?.id]);

  /* -------------------- handlers -------------------- */

  const removeAttachmentConfirmation = (attachmentId) => {
    attachmentToRemoveRef.current = attachmentId;
    $("#remove-attachment-confirmation").modal("show");
  };

  const cancelRemoveAttachmentConfirmation = () => {
    attachmentToRemoveRef.current = null;
    $("#remove-attachment-confirmation").modal("hide");
  };

  const removeAttachment = () => {
    const attachmentId = attachmentToRemoveRef.current;
    if (!attachmentId) return;

    Backend.delete(
      `${projectId}/testcase/${currentTestcase.id}/attachment/${attachmentId}`
    )
      .then(() => {
        attachmentToRemoveRef.current = null;
        $("#remove-attachment-confirmation").modal("hide");

        setCurrentTestcase((prev) => ({
          ...prev,
          attachments: (prev.attachments || []).filter(
            (a) => a.id !== attachmentId
          ),
        }));

        onTestcaseUpdated && onTestcaseUpdated();
      })
      .catch(() => {
        setErrorMessage("removeAttachment::Couldn't remove attachment");
      });
  };

  /* -------------------- render helpers -------------------- */

  const renderAttachment = (attachment) => (
    <div className="row" key={attachment.id}>
      <div className="col-sm-11">
        <a
          href={
            getApiBaseUrl("") +
            projectId +
            "/testcase/" +
            currentTestcase.id +
            "/attachment/" +
            attachment.id
          }
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
  );

  /* -------------------- render -------------------- */

  return (
    <div>
      <ControlledPopup popupMessage={errorMessage} />

      <div id="files" className="attachments-list">
        {(currentTestcase?.attachments || []).map(renderAttachment)}
      </div>

      {!readonly && (
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
      )}

      {/* Remove confirmation modal */}
      <div
        className="modal fade"
        tabIndex="-1"
        role="dialog"
        id="remove-attachment-confirmation"
      >
        <div className="modal-dialog" role="document">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">Remove Attachment</h5>
              <button
                type="button"
                className="close"
                onClick={cancelRemoveAttachmentConfirmation}
                aria-label="Close"
              >
                <span aria-hidden="true">&times;</span>
              </button>
            </div>

            <div className="modal-body">
              Are you sure you want to remove attachment?
            </div>

            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={cancelRemoveAttachmentConfirmation}
              >
                Close
              </button>
              <button
                type="button"
                className="btn btn-danger"
                onClick={removeAttachment}
              >
                Remove Attachment
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

