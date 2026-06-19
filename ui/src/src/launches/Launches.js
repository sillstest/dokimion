/* eslint-disable eqeqeq */
import { withRouter } from "../common/withRouter";
import React, { useState, useEffect, useRef, useCallback } from "react";
import { Link } from "react-router-dom";
import Pager from "../pager/Pager";
import * as Utils from "../common/Utils";
import { FadeLoader } from "react-spinners";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlug } from "@fortawesome/free-solid-svg-icons";
import Backend from "../services/backend";
import ControlledPopup from "../common/ControlledPopup";

const ITEMS_ON_PAGE = 20;
const MAX_VISIBLE_PAGES = 7;

function Launches({ match, history, location, onProjectChange }) {
  const project = match?.params?.project;

  // Restore the project context in App/Header whenever this page loads. App.project resets
  // to "" on a full reload, and only the Project page otherwise sets it — without this the
  // header loses its project nav.
  useEffect(() => {
    if (onProjectChange && project) onProjectChange(project);
  }, [onProjectChange, project]);

  const [launches, setLaunches] = useState([]);
  const [filter, setFilter] = useState(() => ({
    skip: 0,
    limit: ITEMS_ON_PAGE,
    orderby: "id",
    orderdir: "DESC",
    includedFields: "name,launchStats,id,createdTime,startTime,finishTime,launcherConfig,duration,testCaseTree",
    ...Utils.queryToFilter(location.search.substring(1)),
  }));
  const [pagerTotal, setPagerTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(0);
  const [, setLauncherDescriptors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const intervalRef = useRef(null);
  const filterRef = useRef(filter);
  useEffect(() => {
    filterRef.current = filter;
  }, [filter]);

  const fetchLaunches = useCallback(
    f => {
      Backend.get(project + "/launch?" + Utils.filterToQuery(f))
        .then(response => {
          setLaunches(response);
          setLoading(false);
        })
        .catch(error => {
          setErrorMessage("Couldn't get launches: " + error);
          setLoading(false);
        });
    },
    [project],
  );

  const fetchCount = useCallback(
    f => {
      const countFilter = { ...f, skip: 0, limit: 0 };
      Backend.get(project + "/launch/count?" + Utils.filterToQuery(countFilter))
        .then(response => {
          setPagerTotal(response);
          setCurrentPage(f.skip / f.limit);
        })
        .catch(error => console.log(error));
    },
    [project],
  );

  useEffect(() => {
    fetchLaunches(filter);
    fetchCount(filter);
    Backend.get("launcher/descriptors").then(setLauncherDescriptors).catch(console.log);
    intervalRef.current = setInterval(() => fetchLaunches(filterRef.current), 30000);
    return () => clearInterval(intervalRef.current);
    // Mount-only initial load + polling (former componentDidMount); refetches use refs, not deps.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleFilterChange(fieldName, event) {
    const val = event.target.value;
    setFilter(prev => {
      const updated = { ...prev };
      if (val === "") delete updated[fieldName];
      else updated[fieldName] = val;
      return updated;
    });
  }

  function onFilter(event) {
    fetchLaunches(filter);
    fetchCount(filter);
    history.push("/" + project + "/launches?" + Utils.filterToQuery(filter));
    event.preventDefault();
  }

  function handlePageChanged(newPage) {
    const updated = { ...filter, skip: newPage * ITEMS_ON_PAGE };
    setFilter(updated);
    setCurrentPage(newPage);
    fetchLaunches(updated);
    history.push("/" + project + "/launches?" + Utils.filterToQuery(updated));
  }

  function deleteLaunch(launchId) {
    Backend.delete("launcher/" + project + "/" + launchId)
      .then(() => fetchLaunches(filterRef.current))
      .catch(error => setErrorMessage("Couldn't delete launch: " + error));
  }

  function getProgressBar(launch) {
    if (!launch) return null;
    const s = launch.launchStats.statusCounters;
    const total = launch.launchStats.total;
    return (
      <div className="progress">
        <ControlledPopup popupMessage={errorMessage} />
        <div
          className="progress-bar progress-bar-striped"
          role="progressbar"
          style={Utils.getProgressBarStyle(s.RUNNING, total)}
        />
        <div
          className="progress-bar bg-success"
          role="progressbar"
          style={Utils.getProgressBarStyle(s.PASSED, total)}
        />
        <div className="progress-bar bg-danger" role="progressbar" style={Utils.getProgressBarStyle(s.FAILED, total)} />
        <div
          className="progress-bar bg-warning"
          role="progressbar"
          style={Utils.getProgressBarStyle(s.BROKEN, total)}
        />
      </div>
    );
  }

  return (
    <div className="row">
      <div className="col-sm-3 launch-filter">
        <form>
          <div className="form-group">
            <span className="float-right">
              <Link to={"/" + project + "/launches/statistics?" + Utils.filterToQuery(filter)}>Statistics</Link>
            </span>
            <label>
              <h5>Launch Name</h5>
            </label>
            <input
              type="text"
              className="form-control"
              id="name"
              name="name"
              placeholder="Launch title"
              value={filter.like_name || ""}
              onChange={e => handleFilterChange("like_name", e)}
            />
            <small className="form-text text-muted">Find by partly matching Launch title</small>
          </div>
          <button type="submit" className="btn btn-primary" onClick={onFilter}>
            Filter
          </button>
        </form>
      </div>
      <div className="col-sm-9">
        <div className="sweet-loading">
          <FadeLoader size={100} color={"#135f38"} loading={loading} />
        </div>
        <table className="table table-striped">
          <thead>
            <tr>
              <th scope="col">Title</th>
              <th scope="col">Progress</th>
              <th scope="col">Created</th>
              <th scope="col">Started</th>
              <th scope="col">Finished</th>
              <th scope="col">Duration</th>
              <th scope="col">Remove</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {launches.map((launch, i) => (
              <tr key={i}>
                <td>
                  <Link to={"/" + project + "/launch/" + launch.id}>{launch.name}</Link>
                </td>
                <td>{getProgressBar(launch)}</td>
                <td>{Utils.timeToDate(launch.createdTime)}</td>
                <td>{Utils.timeToDate(launch.startTime)}</td>
                <td>{Utils.timeToDate(launch.finishTime)}</td>
                <td>{Utils.timePassed(launch.duration)}</td>
                <td>
                  <button onClick={() => deleteLaunch(launch.id)}>
                    <i className="bi-trash" aria-hidden="true"></i>
                  </button>
                </td>
                <td>
                  {launch.launcherConfig && launch.launcherConfig.launcherId && <FontAwesomeIcon icon={faPlug} />}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <Pager
          totalItems={pagerTotal}
          currentPage={currentPage}
          visiblePages={MAX_VISIBLE_PAGES}
          itemsOnPage={ITEMS_ON_PAGE}
          onPageChanged={handlePageChanged}
        />
      </div>
    </div>
  );
}

export default withRouter(Launches);
