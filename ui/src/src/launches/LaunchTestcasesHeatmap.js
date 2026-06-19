/* eslint-disable eqeqeq */
import React, { useState, useEffect } from "react";
import { withRouter } from "../common/withRouter";
import { Link } from "react-router-dom";
import { FadeLoader } from "react-spinners";
import * as Utils from "../common/Utils";
import { Checkbox } from "semantic-ui-react";
import ControlledPopup from "../common/ControlledPopup";
import Backend from "../services/backend";

function LaunchTestcasesHeatmap({ match, location }) {
  const projectId = match?.params?.project;
  const [heatmap, setHeatmap] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (!projectId) return;
    Backend.get(projectId + "/launch/heatmap" + location.search)
      .then(response => {
        setHeatmap(response);
        setLoading(false);
      })
      .catch(() => {
        setErrorMessage("Couldn't get launch testcases heatmap");
        setLoading(false);
      });
  }, [projectId, location.search]);

  function getPercentile(testcase) {
    if (testcase.total == 0) return 0;
    return Utils.intDiv((testcase.statusCounters.FAILED + testcase.statusCounters.BROKEN) * 100, testcase.total);
  }

  function getCellColorClass(testcase) {
    const failedPercent = getPercentile(testcase);
    if (failedPercent > 33) return Utils.getStatusColorClass("FAILED");
    if (failedPercent <= 33 && failedPercent > 0) return Utils.getStatusColorClass("BROKEN");
    return Utils.getStatusColorClass("PASSED");
  }

  function onBrokenToggle(id, value) {
    Backend.get(projectId + "/testcase/" + id)
      .then(response => {
        const updated = { ...response, launchBroken: value };
        Backend.put(projectId + "/testcase/", updated)
          .then(saved => {
            setHeatmap(prev => prev.map(tc => (tc.id == id ? { ...tc, launchBroken: saved.launchBroken } : tc)));
          })
          .catch(() => setErrorMessage("Couldn't update testcase status"));
      })
      .catch(() => setErrorMessage("Couldn't update testcase status"));
  }

  return (
    <div>
      <ControlledPopup popupMessage={errorMessage} />
      <table className="table">
        <thead>
          <tr>
            <th scope="col">Title</th>
            <th scope="col" className="center-text">
              Failures
            </th>
            <th scope="col">Active</th>
          </tr>
        </thead>
        <tbody>
          {heatmap.map(testcase => (
            <tr key={testcase.id}>
              <td>
                <Link to={"/" + projectId + "/testcase/" + testcase.id}>{testcase.name}</Link>
              </td>
              <td className={getCellColorClass(testcase) + " center-text"}>{getPercentile(testcase)}%</td>
              <td>
                <Checkbox
                  toggle
                  onClick={() => onBrokenToggle(testcase.id, !testcase.launchBroken)}
                  checked={testcase.launchBroken}
                  label={{ children: testcase.launchBroken ? "On" : "Off" }}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="sweet-loading">
        <FadeLoader size={100} color={"#135f38"} loading={loading} />
      </div>
    </div>
  );
}

export default withRouter(LaunchTestcasesHeatmap);
