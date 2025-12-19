import React, { useState, useEffect } from "react";
import { useParams, useLocation } from "react-router-dom";
import LaunchesTrendWidget from "../launches/LaunchesTrendWidget";
import LaunchesByStatusesPieWidget from "../launches/LaunchesByStatusesPieWidget";
import LaunchesByUsersPieWidget from "../launches/LaunchesByUsersPieWidget";
import { FadeLoader } from "react-spinners";
import * as Utils from "../common/Utils";
import ControlledPopup from "../common/ControlledPopup";
import Backend from "../services/backend";
import LaunchesByUserExecutionTrend from "./LaunchesByUserExecutionTrend";

const LaunchesStatisticsOverview = () => {
  const { project: projectId } = useParams();
  const location = useLocation();

  const [stats, setStats] = useState({
    all: {
      launchTimes: {},
    },
  });
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  const getStats = () => {
    Backend.get(`${projectId}/launch/statistics${location.search}`)
      .then(response => {
        setStats(response);
        setLoading(false);
      })
      .catch(error => {
        setErrorMessage(`getStats::Couldn't get launch statistics, error: ${error}`);
        setLoading(false);
      });
  };

  useEffect(() => {
    getStats();
  }, [projectId, location.search]);

  const filter = Utils.queryToFilter(location.search.substring(1));

  return (
    <div>
      <ControlledPopup popupMessage={errorMessage} />
      <div className="sweet-loading">
        <FadeLoader sizeUnit="px" size={100} color="#135f38" loading={loading} />
      </div>
      <div className="row">
        <div className="col-6">
          {stats.all && (
            <table className="table">
              <tbody>
                <tr>
                  <td>Total Launches: {stats.all.launchCount || 0}</td>
                  <td>Total Duration: {Utils.timePassed(stats.all.launchTimes?.duration || 0)}</td>
                  <td>Idle Time: {Utils.timePassed(stats.all.launchTimes?.idle || 0)}</td>
                </tr>
                <tr>
                  <td>First Started: {Utils.timeToDate(stats.all.launchTimes?.firstStart || 0)}</td>
                  <td>Last Finished: {Utils.timeToDate(stats.all.launchTimes?.lastFinish || 0)}</td>
                  <td></td>
                </tr>
              </tbody>
            </table>
          )}
        </div>
      </div>
      <div className="row">
        <div className="col-6">
          <LaunchesByStatusesPieWidget
            projectId={projectId}
            filter={filter}
          />
        </div>
        <div className="col-6">
          <LaunchesByUsersPieWidget
            projectId={projectId}
            filter={filter}
          />
        </div>
      </div>
      <div className="row">
        <div className="col-6">
          <LaunchesTrendWidget
            projectId={projectId}
            filter={filter}
          />
        </div>
        <div className="col-6">
          <LaunchesByUserExecutionTrend 
            projectId={projectId}
            filter={filter}
          />
        </div>
      </div>
    </div>
  );
};

export default LaunchesStatisticsOverview;
