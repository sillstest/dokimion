/* eslint-disable eqeqeq */
import React, { useState, useEffect } from "react";
import $ from "jquery";
import * as bootstrap from 'bootstrap';
import * as Utils from "../common/Utils";
import ControlledPopup from "../common/ControlledPopup";
import Backend from "../services/backend";

const LaunchTestcaseControls = (props) => {
  const defaultFailureDetails = { text: "" };

  const [failureDetails, setFailureDetails] = useState({ ...defaultFailureDetails });
  const [testcase, setTestcase] = useState(props.testcase);
  const [launchId, setLaunchId] = useState(props.launchId);
  const [projectId, setProjectId] = useState(props.projectId);
  const [indicator, setIndicator] = useState(props.indicator);
  const [errorMessage, setErrorMessage] = useState("");

  // Callback reference
  const callback = props.callback || function (testcase) {};

  // Update from props
  useEffect(() => {
    if (props.testcase) {
      setTestcase(props.testcase);
    }
    if (props.launchId) {
      setLaunchId(props.launchId);
    }
    if (props.projectId) {
      setProjectId(props.projectId);
    }
    if (props.indicator) {
      setIndicator(props.indicator);
    }
  }, [props.testcase, props.launchId, props.projectId, props.indicator]);

  // Handle status submit
  const handleStatusSubmit = (status, event, dialogToDismiss) => {
    Backend.post(
      projectId + "/launch/" + launchId + "/" + testcase.uuid + "/status/" + status,
      failureDetails,
    )
      .then(response => {
        setTestcase(response);
        setFailureDetails({ ...defaultFailureDetails });
        callback(response);
        
        if (dialogToDismiss) {
          const modalElement = document.getElementById(dialogToDismiss);
          const modal = bootstrap.Modal.getInstance(modalElement);
          if (modal) {
            modal.hide();
          }
        }
      })
      .catch(error => {
        const updatedTestcase = {
          ...testcase,
          displayErrorMessage: "handleStatusSubmit::Couldn't save launch testcase status: " + error
        };
        setTestcase(updatedTestcase);
        callback(updatedTestcase);
      });
    event.preventDefault();
  };

  // Handle failure details change
  const handleDetailsFailureChange = (event) => {
    setFailureDetails(prev => ({
      ...prev,
      [event.target.name]: event.target.value
    }));
  };

  // Get status alert class
  const getStatusAlertClass = () => {
    switch (testcase.launchStatus) {
      case "FAILED":
        return "alert alert-danger";
      case "BROKEN":
        return "alert alert-warning";
      case "PASSED":
        return "alert alert-success";
      default:
        return "alert";
    }
  };

  // Render runnable buttons
  const renderRunnable = (ind) => {
    if (ind == "START") {
      return (
        <button type="button" className="btn btn-success" onClick={e => handleStatusSubmit("RUNNING", e)}>
          Start
        </button>
      );
    }
    return null;
  };

  // Render running buttons
  const renderRunning = (ind) => {
    if (ind == "FAILUREDETAILS") {
      return (
        <div>
          <button type="button" className="btn btn-success" onClick={e => handleStatusSubmit("PASSED", e)}>
            Pass
          </button>
          <button type="button" className="btn btn-danger" data-toggle="modal" data-target="#fail-dialog">
            Fail
          </button>
          <button type="button" className="btn btn-warning" data-toggle="modal" data-target="#broken-dialog">
            Broken
          </button>
          <button type="button" className="btn btn-secondary" onClick={e => handleStatusSubmit("RUNNABLE", e)}>
            X
          </button>
        </div>
      );
    }
    return null;
  };

  // Render finished buttons
  const renderFinished = (ind) => {
    if (ind == "FAILUREDETAILS") {
      return (
        <div>
          <button className={getStatusAlertClass()} role="alert">
            {testcase.launchStatus}
          </button>
          {testcase.launchStatus && (
            <button
              type="button"
              className="btn"
              onClick={e => handleStatusSubmit("RUNNABLE", e)}
            >
              X
            </button>
          )}
        </div>
      );
    }
    return null;
  };

  // Render buttons based on status
  const renderButtons = () => {
    if (testcase.launchStatus == "RUNNABLE") {
      return renderRunnable(indicator);
    } else if (testcase.launchStatus == "RUNNING") {
      return renderRunning(indicator);
    } else {
      return renderFinished(indicator);
    }
  };

  return (
    <div className="launch-status-controls">
      <div className="btn-group" role="group">
        {renderButtons()}
      </div>

      <div className="modal fade" tabIndex="-1" role="dialog" id="fail-dialog">
        <div className="modal-dialog" role="document">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">Fail Test Case</h5>
              <button type="button" className="close" data-dismiss="modal" aria-label="Close">
                <span aria-hidden="true">&times;</span>
              </button>
            </div>
            <div className="modal-body">
              <textarea
                rows="7"
                id="failure-text"
                name="text"
                className="form-control"
                value={failureDetails.text}
                placeholder="Reason of Failure"
                onChange={handleDetailsFailureChange}
              />
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" data-dismiss="modal" aria-label="Cancel">
                Close
              </button>
              <button
                type="button"
                className="btn btn-danger"
                onClick={e => handleStatusSubmit("FAILED", e, "fail-dialog")}
              >
                Fail
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="modal fade" tabIndex="-1" role="dialog" id="broken-dialog">
        <div className="modal-dialog" role="document">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">Mark Test Case as Broken</h5>
              <button type="button" className="close" data-dismiss="modal" aria-label="Close">
                <span aria-hidden="true">&times;</span>
              </button>
            </div>
            <div className="modal-body">
              <textarea
                rows="7"
                id="failure-text"
                name="text"
                className="form-control"
                value={failureDetails.text}
                placeholder="Reason"
                onChange={handleDetailsFailureChange}
              />
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" data-dismiss="modal" aria-label="Cancel">
                Close
              </button>
              <button
                type="button"
                className="btn btn-warning"
                onClick={e => handleStatusSubmit("BROKEN", e, "broken-dialog")}
              >
                Mark as Broken
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LaunchTestcaseControls;
