import React, { useState, useEffect } from "react";
import { withRouter } from "../common/withRouter";
import LaunchesTrendWidget from "../launches/LaunchesTrendWidget";
import LaunchesByStatusesPieWidget from "../launches/LaunchesByStatusesPieWidget";
import LaunchesByUsersPieWidget from "../launches/LaunchesByUsersPieWidget";
import LaunchesByUserExecutionTrend from "./LaunchesByUserExecutionTrend";
import { FadeLoader } from "react-spinners";
import * as Utils from "../common/Utils";
import ControlledPopup from "../common/ControlledPopup";
import Backend from "../services/backend";

function LaunchesStatisticsOverview({ match, location }) {
  const projectId = match?.params?.project;
  const filter = Utils.queryToFilter(location.search.substring(1));

  const [stats, setStats] = useState({ all: { launchTimes: {} } });
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (!projectId) return;
    Backend.get(projectId + "/launch/statistics" + location.search)
      .then(response => { setStats(response); setLoading(false); })
      .catch(error => { setErrorMessage("Couldn't get launch statistics: " + error); setLoading(false); });
  }, [projectId, location.search]);

  const all = stats.all;

  return (
    <div>
      <ControlledPopup popupMessage={errorMessage} />
      <div className="sweet-loading">
        <FadeLoader size={100} color={"#135f38"} loading={loading} />
      </div>
      <div className="row">
        <div className="col-6">
          {typeof all !== 'undefined' && all.launchCount !== undefined && (
            <table className="table">
              <tbody>
                <tr>
                  <td>Total Launches: {all.launchCount || 0}</td>
                  <td>Total Duration: {Utils.timePassed(all.launchTimes.duration || 0)}</td>
                  <td>Idle Time: {Utils.timePassed(all.launchTimes.idle || 0)}</td>
                </tr>
                <tr>
                  <td>First Started: {Utils.timeToDate(all.launchTimes.firstStart || 0)}</td>
                  <td>Last Finished: {Utils.timeToDate(all.launchTimes.lastFinish || 0)}</td>
                  <td></td>
                </tr>
              </tbody>
            </table>
          )}
        </div>
      </div>
      <div className="row">
        <div className="col-6"><LaunchesByStatusesPieWidget projectId={projectId} filter={filter} /></div>
        <div className="col-6"><LaunchesByUsersPieWidget projectId={projectId} filter={filter} /></div>
      </div>
      <div className="row">
        <div className="col-6"><LaunchesTrendWidget projectId={projectId} filter={filter} /></div>
        <div className="col-6"><LaunchesByUserExecutionTrend projectId={projectId} filter={filter} /></div>
      </div>
    </div>
  );
}

export default withRouter(LaunchesStatisticsOverview);
