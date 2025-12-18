import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import * as Utils from "../common/Utils";
import { FadeLoader } from "react-spinners";
import Backend from "../services/backend";
import ControlledPopup from "../common/ControlledPopup";

const LaunchesWidget = (props) => {
  const [launches, setLaunches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [projectId, setProjectId] = useState(props.projectId);

  const limit = props.limit || 5;

  // Get progress style
  const getProgressStyle = (value, total) => {
    return { width: (value * 100) / total + "%" };
  };

  // Get progress bar
  const getProgressBar = (launch) => {
    return (
      <div className="progress">
        <ControlledPopup popupMessage={errorMessage} />
        <div
          className="progress-bar progress-bar-striped"
          role="progressbar"
          style={getProgressStyle(launch.launchStats.statusCounters.RUNNING, launch.launchStats.total)}
        ></div>
        <div
          className="progress-bar bg-success"
          role="progressbar"
          style={getProgressStyle(launch.launchStats.statusCounters.PASSED, launch.launchStats.total)}
        ></div>
        <div
          className="progress-bar bg-danger"
          role="progressbar"
          style={getProgressStyle(launch.launchStats.statusCounters.FAILED, launch.launchStats.total)}
        ></div>
        <div
          className="progress-bar bg-warning"
          role="progressbar"
          style={getProgressStyle(launch.launchStats.statusCounters.BROKEN, launch.launchStats.total)}
        ></div>
      </div>
    );
  };

  // Get launches
  const getLaunches = (currentProjectId) => {
    if (!currentProjectId) {
      return;
    }
    Backend.get(
      currentProjectId + "/launch?includedFields=name,id,launchStats&orderby=id&orderdir=DESC&limit=" + limit
    )
      .then(response => {
        setLaunches(response);
        setLoading(false);
      })
      .catch(error => {
        setErrorMessage("getLaunches::Couldn't get launch, error: " + error);
        setLoading(false);
      });
  };

  // Update projectId from props
  useEffect(() => {
    if (props.projectId && projectId !== props.projectId) {
      setProjectId(props.projectId);
    }
  }, [props.projectId]);

  // Fetch launches when projectId changes
  useEffect(() => {
    if (projectId) {
      getLaunches(projectId);
    }
  }, [projectId]);

  return (
    <div>
      <div className="sweet-loading">
        <FadeLoader sizeUnit={"px"} size={100} color={"#135f38"} loading={loading} />
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
            <tr key={launch.id || index}>
              <td>
                <Link to={"/" + projectId + "/launch/" + launch.id}>{launch.name}</Link>
              </td>
              <td>{getProgressBar(launch)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default LaunchesWidget;
