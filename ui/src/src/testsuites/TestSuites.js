import React, { useState, useEffect, useRef } from "react";
import { withRouter } from "../common/withRouter";
import { Link } from "react-router-dom";
import ControlledPopup from "../common/ControlledPopup";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faMinusCircle } from "../common/icons";
import $ from "jquery";
import { FadeLoader } from "react-spinners";
import Backend from "../services/backend";

function TestSuites({ match, onProjectChange }) {
  const project = match?.params?.project;

  // Restore the project context in App/Header whenever this page loads. App.project resets
  // to "" on a full reload, and only the Project page otherwise sets it — without this the
  // header loses its project nav.
  useEffect(() => {
    if (onProjectChange && project) onProjectChange(project);
  }, [onProjectChange, project]);

  const [testSuites, setTestSuites] = useState([]);
  const [testSuitesToDisplay, setTestSuitesToDisplay] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const testSuiteToRemove = useRef(null);

  useEffect(() => {
    if (!project) return;
    Backend.get(project + "/testsuite")
      .then(response => { setTestSuites(response); setTestSuitesToDisplay(response); setLoading(false); })
      .catch(error => { setErrorMessage("Couldn't get testsuites: " + error); setLoading(false); });
  }, [project]);

  function onFilter(event) {
    const token = (event.target.value || "").toLowerCase();
    setTestSuitesToDisplay(testSuites.filter(ts => (ts.name || "").toLowerCase().includes(token)));
  }

  function removeTestSuiteConfirmation(testSuiteId) {
    testSuiteToRemove.current = testSuiteId;
    $("#remove-testsuite-confirmation").modal("show");
  }

  function cancelRemoveTestSuiteConfirmation() {
    testSuiteToRemove.current = null;
    $("#remove-testsuite-confirmation").modal("hide");
  }

  function removeTestSuite() {
    Backend.delete(project + "/testsuite/" + testSuiteToRemove.current)
      .then(() => {
        const id = testSuiteToRemove.current;
        // eslint-disable-next-line eqeqeq
        setTestSuites(prev => { const u = prev.filter(ts => ts.id != id); setTestSuitesToDisplay(u); return u; });
        testSuiteToRemove.current = null;
        $("#remove-testsuite-confirmation").modal("hide");
      })
      .catch(error => setErrorMessage("Couldn't delete testsuite: " + error));
  }

  return (
    <div>
      <ControlledPopup popupMessage={errorMessage} />
      <div className="row">
        <form className="col-sm-5">
          <div className="form-group">
            <input type="text" className="form-control" id="filter" placeholder="Filter" onChange={onFilter} />
          </div>
        </form>
      </div>
      <div className="row">
        <div className="sweet-loading">
          <FadeLoader size={100} color={"#135f38"} loading={loading} />
        </div>
        {testSuitesToDisplay.map(testSuite => (
          <div className="col-sm-6" key={testSuite.id}>
            <div className="card testsuite-card col-sm-10">
              <div className="card-body">
                <div className="row">
                  <div className="col-11">
                    <h5 className="card-title">{testSuite.name}</h5>
                  </div>
                  <div className="col1">
                    <span className="clickable edit-icon-visible red float-right" onClick={() => removeTestSuiteConfirmation(testSuite.id)}>
                      <FontAwesomeIcon icon={faMinusCircle} />
                    </span>
                  </div>
                </div>
                <p className="card-text">
                  <Link to={"/" + project + "/testcases?testSuite=" + testSuite.id}>View</Link>
                </p>
              </div>
            </div>
            <div className="col-sm-1"></div>
          </div>
        ))}
      </div>

      <div className="modal fade" tabIndex="-1" role="dialog" id="remove-testsuite-confirmation">
        <div className="modal-dialog" role="document">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">Remove Test Suite</h5>
              <button type="button" className="close" onClick={cancelRemoveTestSuiteConfirmation} aria-label="Close">
                <span aria-hidden="true">&times;</span>
              </button>
            </div>
            <div className="modal-body">Are you sure you want to remove Test Suite?</div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={cancelRemoveTestSuiteConfirmation}>Close</button>
              <button type="button" className="btn btn-danger" onClick={removeTestSuite}>Remove Test Suite</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default withRouter(TestSuites);
