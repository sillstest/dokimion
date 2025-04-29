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

class Results extends SubComponent {
  constructor(props) {
    super(props);

    this.resultToRemove = null;

    this.state = {
      testcase: {
        results: [],
      },
      projectId: props.projectId,
      // eslint-disable-next-line no-dupe-keys
      testcase: props.testcase,
      errorMessage: "",
    };
    this.getResultUrl = this.getResultUrl.bind(this);
    this.removeResult = this.removeResult.bind(this);
    this.removeResultConfirmation = this.removeResultConfirmation.bind(this);
    this.cancelRemoveResultConfirmation = this.cancelRemoveResultConfirmation.bind(this);
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.testcase) {
      this.state.testcase = nextProps.testcase;
    }
    if (nextProps.projectId) {
      this.state.projectId = nextProps.projectId;
    }
    this.setState(this.state);
    if (this.state.projectId && this.state.testcase.id && this.state.testcase.id != null) {
      $("#file-data").fileinput('destroy');
      $("#file-data").fileinput({
        previewFileType: "any",
        uploadUrl: getApiBaseUrl(this.state.projectId + "/testcase/" + this.state.testcase.id + "/result"),
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
  }

  removeResult() {

    Backend.delete(
      this.state.projectId + "/testcase/" + this.state.testcase.id + "/result/" + this.resultToRemove,
    )
      .then(response => {
        this.resultToRemove = null;
        $("#remove-result-confirmation").modal("hide");
        this.state.testcase.results = (this.state.testcase.results || []).filter(
          result => result.id !== this.resultToRemove,
        );
        this.onTestcaseUpdated();
      })
      .catch(error => {
        this.setState({errorMessage: "removeResult::Couldn't remove result, error: " + error});
      });
  }

  removeResultConfirmation(resultId) {
    this.resultToRemove = resultId;
    $("#remove-result-confirmation").modal("show");
  }

  cancelRemoveResultConfirmation() {
    this.issueToRemove = null;
    $("#remove-result-confirmation").modal("hide");
  }

  getResultUrl(result) {
     return (
      <div className="row">
        <div className="col-sm-11">
          <a
            href={
              getApiBaseUrl("") +
              this.state.projectId +
              "/testcase/" +
              this.state.testcase.id +
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
            onClick={e => this.removeResultConfirmation(result.id, e)}
          >
            <FontAwesomeIcon icon={faMinusCircle} />
          </span>
        </div>
      </div>
    );
  }

  render() {
    return (
      <div>
        <ControlledPopup popupMessage={this.state.errorMessage}/>
        <div id="files" className="results-list">
          {(this.state.testcase.results || []).map(this.getResultUrl)}
        </div>

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

        <div className="modal fade" tabIndex="-1" role="dialog" id="remove-result-confirmation">
          <div className="modal-dialog" role="document">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Remove Result</h5>
                <button
                  type="button"
                  className="close"
                  onClick={this.cancelRemoveResultConfirmation}
                  aria-label="Close"
                >
                  <span aria-hidden="true">&times;</span>
                </button>
              </div>
              <div className="modal-body">Are you sure you want to remove result?</div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={this.cancelRemoveResultConfirmation}>
                  Close
                </button>
                <button type="button" className="btn btn-danger" onClick={this.removeResult}>
                  Remove Result
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default Results;
