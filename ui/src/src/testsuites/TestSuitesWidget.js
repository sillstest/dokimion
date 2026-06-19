import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import ControlledPopup from "../common/ControlledPopup";
import { FadeLoader } from "react-spinners";
import Backend from "../services/backend";

function TestSuitesWidget({ projectId, limit: limitProp }) {
  const limit = limitProp || 5;
  const [testSuites, setTestSuites] = useState([]);
  const [testSuitesToDisplay, setTestSuitesToDisplay] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (!projectId) return;
    Backend.get(projectId + "/testsuite")
      .then(response => {
        setTestSuites(response);
        setTestSuitesToDisplay(response.slice(0, limit));
        setLoading(false);
      })
      .catch(error => {
        setErrorMessage("Couldn't get testsuites: " + error);
        setLoading(false);
      });
    // Reloads when projectId changes; limit is a stable prop.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  function onFilter(event) {
    const token = (event.target.value || "").toLowerCase();
    setTestSuitesToDisplay(testSuites.filter(ts => (ts.name || "").toLowerCase().includes(token)).slice(0, limit));
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
      <div>
        <div className="sweet-loading">
          <FadeLoader size={100} color={"#135f38"} loading={loading} />
        </div>
        {testSuitesToDisplay.map((testSuite, index) => (
          <div key={index}>
            <Link to={"/" + projectId + "/testcases?testSuite=" + testSuite.id}>{testSuite.name}</Link>
          </div>
        ))}
      </div>
    </div>
  );
}

export default TestSuitesWidget;
