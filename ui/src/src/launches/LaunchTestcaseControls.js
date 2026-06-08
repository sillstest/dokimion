/* eslint-disable eqeqeq */
import React, { useState, useEffect, useRef } from "react";
import $ from "jquery";
import ControlledPopup from "../common/ControlledPopup";
import Backend from "../services/backend";

function LaunchTestcaseControls({ testcase: testcaseProp, launchId: launchIdProp, projectId, indicator, callback }) {
  const [testcase, setTestcase] = useState(testcaseProp || {});
  const [launchId, setLaunchId] = useState(launchIdProp);
  const [failureDetails, setFailureDetails] = useState({ text: "" });
  const [errorMessage, setErrorMessage] = useState("");
  const callbackRef = useRef(callback || (() => {}));

  useEffect(() => { callbackRef.current = callback || (() => {}); }, [callback]);

  useEffect(() => {
    if (testcaseProp !== undefined) setTestcase(testcaseProp);
  }, [testcaseProp]);

  useEffect(() => {
    if (launchIdProp !== undefined) setLaunchId(launchIdProp);
  }, [launchIdProp]);

  function handleStatusSubmit(status, event, dialogToDismiss) {
    Backend.post(
      projectId + "/launch/" + launchId + "/" + testcase.uuid + "/status/" + status,
      failureDetails,
    )
      .then(response => {
        setTestcase(response);
        setFailureDetails({ text: "" });
        callbackRef.current(response);
        if (dialogToDismiss) $("#" + dialogToDismiss).modal("hide");
      })
      .catch(error => {
        const updated = { ...testcase, displayErrorMessage: "Couldn't save launch testcase status: " + error };
        setTestcase(updated);
        callbackRef.current(updated);
      });
    event.preventDefault();
  }

  function getStatusAlertClass() {
    switch (testcase.launchStatus) {
      case "FAILED": return "alert alert-danger";
      case "BROKEN": return "alert alert-warning";
      case "PASSED": return "alert alert-success";
      default: return "alert";
    }
  }

  function renderButtons() {
    if (testcase.launchStatus == "RUNNABLE") {
      if (indicator == "START") {
        return <button type="button" className="btn btn-success" onClick={e => handleStatusSubmit("RUNNING", e)}>Start</button>;
      }
    } else if (testcase.launchStatus == "RUNNING") {
      if (indicator == "FAILUREDETAILS") {
        return (
          <div>
            <button type="button" className="btn btn-success" onClick={e => handleStatusSubmit("PASSED", e)}>Pass</button>
            <button type="button" className="btn btn-danger" onClick={() => $("#fail-dialog").modal("show")}>Fail</button>
            <button type="button" className="btn btn-warning" onClick={() => $("#broken-dialog").modal("show")}>Broken</button>
            <button type="button" className="btn btn-secondary" onClick={e => handleStatusSubmit("RUNNABLE", e)}>X</button>
          </div>
        );
      }
    } else {
      if (indicator == "FAILUREDETAILS" && testcase.launchStatus !== undefined) {
        return (
          <span>
            <button className={getStatusAlertClass()} role="alert">{testcase.launchStatus}</button>
            <button type="button" className="btn" onClick={e => handleStatusSubmit("RUNNABLE", e)}>X</button>
          </span>
        );
      }
    }
    return null;
  }

  return (
    <div className="launch-status-controls">
      <div className="btn-group" role="group">{renderButtons()}</div>

      <div className="modal fade" tabIndex="-1" role="dialog" id="fail-dialog">
        <div className="modal-dialog" role="document">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">Fail Test Case</h5>
              <button type="button" className="close" onClick={() => $("#fail-dialog").modal("hide")} aria-label="Close"><span aria-hidden="true">&times;</span></button>
            </div>
            <div className="modal-body">
              <textarea rows="7" id="failure-text" name="text" className="form-control" value={failureDetails.text}
                placeholder="Reason of Failure" onChange={e => setFailureDetails(prev => ({ ...prev, text: e.target.value }))} />
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={() => $("#fail-dialog").modal("hide")} aria-label="Cancel">Close</button>
              <button type="button" className="btn btn-danger" onClick={e => handleStatusSubmit("FAILED", e, "fail-dialog")}>Fail</button>
            </div>
          </div>
        </div>
      </div>

      <div className="modal fade" tabIndex="-1" role="dialog" id="broken-dialog">
        <div className="modal-dialog" role="document">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">Mark Test Case as Broken</h5>
              <button type="button" className="close" onClick={() => $("#broken-dialog").modal("hide")} aria-label="Close"><span aria-hidden="true">&times;</span></button>
            </div>
            <div className="modal-body">
              <textarea rows="7" id="failure-text" name="text" className="form-control" value={failureDetails.text}
                placeholder="Reason" onChange={e => setFailureDetails(prev => ({ ...prev, text: e.target.value }))} />
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={() => $("#broken-dialog").modal("hide")} aria-label="Cancel">Close</button>
              <button type="button" className="btn btn-warning" onClick={e => handleStatusSubmit("BROKEN", e, "broken-dialog")}>Mark as Broken</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LaunchTestcaseControls;
