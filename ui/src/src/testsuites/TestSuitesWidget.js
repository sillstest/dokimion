import React, { useState, useEffect } from "react";
import SubComponent from "../common/SubComponent";
import { Link } from "react-router-dom";
import ControlledPopup from "../common/ControlledPopup";
import { FadeLoader } from "react-spinners";
import Backend from "../services/backend";

const TestSuitesWidget = ({ projectId, limit = 5 }) => {
  const [testSuites, setTestSuites] = useState([]);
  const [testSuitesToDisplay, setTestSuitesToDisplay] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  // Fetch test suites whenever projectId changes
  useEffect(() => {
    if (!projectId) {
      setLoading(false);
      return;
    }

    const getTestSuites = async () => {
      setLoading(true);
      try {
        const response = await Backend.get(`${projectId}/testsuite`);
        setTestSuites(response);
        setTestSuitesToDisplay(response.slice(0, limit));
        setLoading(false);
      } catch (error) {
        setErrorMessage("getTestSuites::Couldn't get testsuites, error: " + error);
        setLoading(false);
      }
    };

    getTestSuites();
  }, [projectId, limit]);

  const onFilter = (event) => {
    const token = (event.target.value || "").toLowerCase();
    const filtered = testSuites
      .filter((testSuite) =>
        (testSuite.name || "").toLowerCase().includes(token)
      )
      .slice(0, limit);
    setTestSuitesToDisplay(filtered);
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

      <div>
        <div className="sweet-loading">
          <FadeLoader
            sizeUnit={"px"}
            size={100}
            color={"#135f38"}
            loading={loading}
          />
        </div>

        {testSuitesToDisplay.map((testSuite, index) => (
          <div key={testSuite.id || index}>
            <Link to={`/${projectId}/testcases?testSuite=${testSuite.id}`}>
              {testSuite.name}
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TestSuitesWidget;
