/* eslint-disable eqeqeq */
import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { FadeLoader } from "react-spinners";
import Backend from "../services/backend";
import ControlledPopup from "../common/ControlledPopup";

function LaunchesWidget({ projectId, limit: limitProp }) {
  const limit = limitProp || 5;
  const [launches, setLaunches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (!projectId) return;
    Backend.get(projectId + "/launch?includedFields=name,id,launchStats&orderby=id&orderdir=DESC&limit=" + limit)
      .then(response => {
        setLaunches(response);
        setLoading(false);
      })
      .catch(error => {
        setErrorMessage("Couldn't get launches: " + error);
        setLoading(false);
      });
    // Reloads when projectId changes; limit is a stable prop.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  function getProgressStyle(value, total) {
    return { width: (value * 100) / total + "%" };
  }

  return (
    <div>
      <ControlledPopup popupMessage={errorMessage} />
      <div className="sweet-loading">
        <FadeLoader size={100} color={"#135f38"} loading={loading} />
      </div>
      <table className="table table-striped">
        <thead>
          <tr>
            <th scope="col">Title</th>
            <th scope="col">Progress</th>
          </tr>
        </thead>
        <tbody>
          {launches.map((launch, index) => (
            <tr key={index}>
              <td>
                <Link to={"/" + projectId + "/launch/" + launch.id}>{launch.name}</Link>
              </td>
              <td>
                <div className="progress">
                  <div
                    className="progress-bar progress-bar-striped"
                    role="progressbar"
                    style={getProgressStyle(launch.launchStats.statusCounters.RUNNING, launch.launchStats.total)}
                  />
                  <div
                    className="progress-bar bg-success"
                    role="progressbar"
                    style={getProgressStyle(launch.launchStats.statusCounters.PASSED, launch.launchStats.total)}
                  />
                  <div
                    className="progress-bar bg-danger"
                    role="progressbar"
                    style={getProgressStyle(launch.launchStats.statusCounters.FAILED, launch.launchStats.total)}
                  />
                  <div
                    className="progress-bar bg-warning"
                    role="progressbar"
                    style={getProgressStyle(launch.launchStats.statusCounters.BROKEN, launch.launchStats.total)}
                  />
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default LaunchesWidget;
