import React, { useState, useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import ControlledPopup from "../common/ControlledPopup";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faMinusCircle } from "@fortawesome/free-solid-svg-icons";
import $ from "jquery";
import { FadeLoader } from "react-spinners";
import Backend from "../services/backend";

const TestSuites = () => {
  const { project } = useParams(); // replaces this.props.router.params.project

  const [testSuites, setTestSuites] = useState([]);
  const [testSuitesToDisplay, setTestSuitesToDisplay] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [testSuiteToRemove, setTestSuiteToRemove] = useState(null);

  useEffect(() => {
    getTestSuites();
  }, []); // runs once on mount

  const getTestSuites = () => {
    Backend.get(`${project}/testsuite`)
      .then((response) => {
        setTestSuites(response);
        setTestSuitesToDisplay(response);
        setLoading(false);
      })
      .catch((error) => {
        setErrorMessage(`getTestSuites::Couldn't get testsuites, error: ${error}`);
        setLoading(false);
      });
  };

  const onFilter = (event) => {
    const token = (event.target.value || "").toLowerCase();
    const filtered = testSuites.filter((testSuite) =>
      (testSuite.name || "").toLowerCase().includes(token)
    );
    setTestSuitesToDisplay(filtered);
  };

  const removeTestSuiteConfirmation = (testSuiteId) => {
    setTestSuiteToRemove(testSuiteId);
    $("#remove-testsuite-confirmation").modal("show");
  };

  const cancelRemoveTestSuiteConfirmation = () => {
    setTestSuiteToRemove(null);
    $("#remove-testsuite-confirmation").modal("hide");
  };

  const removeTestSuite = () => {
    Backend.delete(`${project}/testsuite/${testSuiteToRemove}`)
      .then(() => {
        const updatedSuites = testSuites.filter(
          (testSuite) => testSuite.id !== testSuiteToRemove
        );
        setTestSuites(updatedSuites);
        setTestSuitesToDisplay(updatedSuites);
        setTestSuiteToRemove(null);
        $("#remove-testsuite-confirmation").modal("hide");
      })
      .catch((error) => {
        setErrorMessage(`removeTestSuite::Couldn't delete testsuite, error: ${error}`);
      });
  };

  return (
    <div>
      <ControlledPopup popupMessage={errorMessage} />

      <div className="row">
        <form className="col-sm-5">
          <div className="form-group">
            <input
              type="text"
              className="form-control"
              id="filter"
              placeholder="Filter"
              onChange={onFilter}
            />
          </div>
        </form>
      </div>

      <div className="row">
        <div className="sweet-loading">
          <FadeLoader sizeUnit="px" size={100} color="#135f38" loading={loading} />
        </div>

        {testSuitesToDisplay.map((testSuite) => (
          <div className="col-sm-6" key={testSuite.id}>
            <div className="card testsuite-card col-sm-10">
              <div className="card-body">
                <div className="row">
                  <div className="col-11">
                    <h5 className="card-title">{testSuite.name}</h5>
                  </div>
                  <div className="col-1">
                    <span
                      className="clickable edit-icon-visible red float-right"
                      onClick={() => removeTestSuiteConfirmation(testSuite.id)}
                    >
                      <FontAwesomeIcon icon={faMinusCircle} />
                    </span>
                  </div>
                </div>
                <p className="card-text">
                  <Link to={`/${project}/testcases?testSuite=${testSuite.id}`}>
                    View
                  </Link>
                </p>
              </div>
            </div>
            <div className="col-sm-1" />
          </div>
        ))}
      </div>

      {/* Confirmation Modal */}
      <div
        className="modal fade"
        tabIndex="-1"
        role="dialog"
        id="remove-testsuite-confirmation"
      >
        <div className="modal-dialog" role="document">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">Remove Test Suite</h5>
              <button
                type="button"
                className="close"
                onClick={cancelRemoveTestSuiteConfirmation}
                aria-label="Close"
              >
                <span aria-hidden="true">&times;</span>
              </button>
            </div>
            <div className="modal-body">
              Are you sure you want to remove Test Suite?
            </div>
            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={cancelRemoveTestSuiteConfirmation}
              >
                Close
              </button>
              <button
                type="button"
                className="btn btn-danger"
                onClick={removeTestSuite}
              >
                Remove Test Suite
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// We still wrap with SubComponent (your base class logic) if needed
export default TestSuites;
