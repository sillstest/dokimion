import React from "react";
import SubComponent from "../common/SubComponent";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faMinusCircle } from "@fortawesome/free-solid-svg-icons";
import $ from "jquery";
import * as Utils from "../common/Utils";
import ControlledPopup from "../common/ControlledPopup";
import Backend, { getApiBaseUrl } from "../services/backend";
require("popper.js/dist/umd/popper.min.js");
require("bootstrap-fileinput/css/fileinput.min.css");
require("bootstrap-fileinput/js/fileinput.min.js");
require("bootstrap-icons/font/bootstrap-icons.css");

class Attachments extends SubComponent {
  constructor(props) {
    super(props);

    this.attachmentToRemove = null;

    this.state = {
      testcase: {
        attachments: [],
      },
      projectId: props.projectId,
      // eslint-disable-next-line no-dupe-keys
      testcase: props.testcase,
      readonly: props.readonly,
      testDeveloper: props.testDeveloper,
      errorMessage: "",
    };
    this.getAttachmentUrl = this.getAttachmentUrl.bind(this);
    this.removeAttachment = this.removeAttachment.bind(this);
    this.removeAttachmentConfirmation = this.removeAttachmentConfirmation.bind(this);
    this.cancelRemoveAttachmentConfirmation = this.cancelRemoveAttachmentConfirmation.bind(this);
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.testcase) {
      this.state.testcase = nextProps.testcase;
    }
    if (nextProps.projectId) {
      this.state.projectId = nextProps.projectId;
    }
    this.state.readonly = nextProps.readonly;

    this.setState(this.state);
    if (this.state.projectId && this.state.testcase.id && this.state.testcase.id != null) {
      $("#file-data").fileinput('destroy');
      $("#file-data").fileinput({
        previewFileType: "any",
        uploadUrl: getApiBaseUrl(this.state.projectId + "/testcase/" + this.state.testcase.id + "/attachment"),
        maxFileSize: 100000
      });
      $("#file-data").on(
        "fileuploaded",
        function (event, file, previewId, index) {
            this.onTestcaseUpdated();
        }.bind(this),
      );
    }
  }

  componentDidMount() {
    super.componentDidMount();
    this.onTestcaseUpdated = this.props.onTestcaseUpdated;
    this.state.readonly = this.props.readonly;
    this.state.testDeveloper = this.props.testDeveloper;
  }

  removeAttachment() {
console.log("Attachments::removeAttachment");

    Backend.delete(
      this.state.projectId + "/testcase/" + this.state.testcase.id + "/attachment/" + this.attachmentToRemove,
    )
      .then(response => {
        this.attachmentToRemove = null;
        $("#remove-attachment-confirmation").modal("hide");
        this.state.testcase.attachments = (this.state.testcase.attachments || []).filter(
          attachment => attachment.id !== this.attachmentToRemove,
        );
        this.onTestcaseUpdated();
      })
      .catch(error => {
        this.setState({errorMessage: "Couldn't remove attachment: " + error});
      });
  }

  removeAttachmentConfirmation(attachmentId) {
    this.attachmentToRemove = attachmentId;
    $("#remove-attachment-confirmation").modal("show");
  }

  cancelRemoveAttachmentConfirmation() {
    this.issueToRemove = null;
    $("#remove-attachment-confirmation").modal("hide");
  }

  getAttachmentUrl(attachment) {
    return (
      <div className="row">
        <div className="col-sm-11">
          <a
            href={
              getApiBaseUrl("") +
              this.state.projectId +
              "/testcase/" +
              this.state.testcase.id +
              "/attachment/" +
              attachment.id
            }
            target="_blank"
            rel="noreferrer"
          >
            {attachment.title}
          </a>
        </div>
        {!(this.state.readonly || this.state.testDeveloper) && (
          <div className="col-sm-1">
            <span
              className="clickable edit-icon-visible red"
              onClick={e => this.removeAttachmentConfirmation(attachment.id, e)}
            >
              <FontAwesomeIcon icon={faMinusCircle} />
            </span>
          </div>
        )}
      </div>
    );
  }

  render() {
    return (
      <div>
        <ControlledPopup popupMessage={this.state.errorMessage}/>
        <div id="files" className="attachments-list">
          {(this.state.testcase.attachments || []).map(this.getAttachmentUrl)}
        </div>

        {!this.state.readonly && (
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
                <button
                  type="button"
                  className="close"
                  onClick={this.cancelRemoveAttachmentConfirmation}
                  aria-label="Close"
                >
                  <span aria-hidden="true">&times;</span>
                </button>
              </div>
              <div className="modal-body">Are you sure you want to remove attachment?</div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={this.cancelRemoveAttachmentConfirmation}>
                  Close
                </button>
                <button type="button" className="btn btn-danger" onClick={this.removeAttachment}>
                  Remove Attachment
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default Attachments;
