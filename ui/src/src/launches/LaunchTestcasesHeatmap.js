/* eslint-disable eqeqeq */
import React, { useState, useEffect } from "react";
import { useParams, useLocation, Link } from "react-router-dom";
import { FadeLoader } from "react-spinners";
import * as Utils from "../common/Utils";
import { Checkbox } from "@mui/material";
import ControlledPopup from "../common/ControlledPopup";
import Backend from "../services/backend";

const LaunchTestcasesHeatmap = () => {
  const { project: projectId } = useParams();
  const location = useLocation();

  const [heatmap, setHeatmap] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  // Get percentile
  const getPercentile = (testcase) => {
    if (testcase.total == 0) {
      return 0;
    }
    return Utils.intDiv((testcase.statusCounters.FAILED + testcase.statusCounters.BROKEN) * 100, testcase.total);
  };

  // Get cell color class
  const getCellColorClass = (testcase) => {
    const failedPercent = getPercentile(testcase);
    if (failedPercent > 33) {
      return Utils.getStatusColorClass("FAILED");
    }
    if (failedPercent <= 33 && failedPercent > 0) {
      return Utils.getStatusColorClass("BROKEN");
    }
    return Utils.getStatusColorClass("PASSED");
  };

  // Update testcase
  const updateTestcase = (testcaseToUpdate) => {
    Backend.put(projectId + "/testcase/", testcaseToUpdate)
      .then(response => {
        setHeatmap(prevHeatmap => {
          const updatedHeatmap = [...prevHeatmap];
          const foundTestcaseStats = updatedHeatmap.find(testcaseStats => testcaseStats.id == testcaseToUpdate.id);
          if (foundTestcaseStats) {
            foundTestcaseStats.launchBroken = response.launchBroken;
          }
          return updatedHeatmap;
        });
      })
      .catch(error => {
        setErrorMessage("updateTestcase::Couldn't update testcase status");
      });
  };

  // On broken toggle
  const onBrokenToggle = (id, value, event) => {
    Backend.get(projectId + "/testcase/" + id)
      .then(response => {
        const testcaseToUpdate = response;
        if (testcaseToUpdate) {
          testcaseToUpdate.launchBroken = value;
          updateTestcase(testcaseToUpdate);
        }
      })
      .catch(error => {
        setErrorMessage("onBrokenToggle::Couldn't update testcase status");
      });
  };

  // Get heatmap
  const getHeatMap = () => {
    Backend.get(projectId + "/launch/heatmap" + location.search)
      .then(response => {
        setHeatmap(response);
        setLoading(false);
      })
      .catch(error => {
        setErrorMessage("getHeatMap::Couldn't get launch testcases heatmap");
        setLoading(false);
      });
  };

  // Component mount
  useEffect(() => {
    getHeatMap();
  }, [projectId, location.search]);

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
          {heatmap.map((testcase) => (
            <tr key={testcase.id}>
              <td>
                <Link to={"/" + projectId + "/testcase/" + testcase.id}>
                  {testcase.name}
                </Link>
              </td>
              <td className={getCellColorClass(testcase) + " center-text"}>
                {getPercentile(testcase)}%
              </td>
              <td>
                <Checkbox
                  toggle
                  onClick={e => onBrokenToggle(testcase.id, !testcase.launchBroken, e)}
                  checked={testcase.launchBroken}
                  label={{ children: testcase.launchBroken ? "On" : "Off" }}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="sweet-loading">
        <FadeLoader sizeUnit={"px"} size={100} color={"#135f38"} loading={loading} />
      </div>
    </div>
  );
};

export default LaunchTestcasesHeatmap;
