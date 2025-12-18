/* eslint-disable eqeqeq */
import React, { useState, useEffect, useRef } from "react";
import { Link, useParams, useNavigate, useLocation } from "react-router-dom";
import Pager from "../pager/Pager";
import * as Utils from "../common/Utils";
import { FadeLoader } from "react-spinners";
import Button from "@mui/material/Button";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTrash, faPlug } from "@fortawesome/free-solid-svg-icons";
import Backend from "../services/backend";
import ControlledPopup from "../common/ControlledPopup";
import DatePicker from "react-date-picker";

const Launches = () => {
  const { project: projectId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const [launches, setLaunches] = useState([]);
  const [filter, setFilter] = useState({
    skip: 0,
    limit: 20,
    orderby: "id",
    orderdir: "DESC",
    includedFields: "name,launchStats,id,createdTime,startTime,finishTime,launcherConfig,duration,testCaseTree",
  });
  const [pager, setPager] = useState({
    total: 0,
    current: 0,
    maxVisiblePage: 7,
    itemsOnPage: 20,
  });
  const [launcherDescriptors, setLauncherDescriptors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  const intervalRef = useRef(null);

  // Get launches
  const getLaunches = () => {
    Backend.get(projectId + "/launch?" + Utils.filterToQuery(filter))
      .then(response => {
        setLaunches(response);
        setLoading(false);
      })
      .catch(error => {
        setErrorMessage("getLaunches::Couldn't get launches, error: " + error);
        setLoading(false);
      });
  };

  // Delete launch
  const deleteLaunch = (launchId) => {
    Backend.delete("launcher/" + projectId + "/" + launchId)
      .then(response => {
        getLaunches();
      })
      .catch(error => {
        setErrorMessage("deleteLaunch::Couldn't delete launch, error: " + error);
      });
  };

  // Get pager
  const getPager = () => {
    const countFilter = Object.assign({}, filter);
    countFilter.skip = 0;
    countFilter.limit = 0;
    Backend.get(projectId + "/launch/count?" + Utils.filterToQuery(countFilter))
      .then(response => {
        setPager(prev => ({
          ...prev,
          total: response,
          current: filter.skip / filter.limit,
          visiblePage: Math.min(
            response / prev.itemsOnPage + 1,
            prev.maxVisiblePage
          )
        }));
      })
      .catch(error => console.log(error));
  };

  // Get launcher descriptors
  const getLauncherDescriptors = () => {
    Backend.get("launcher/descriptors")
      .then(response => {
        setLauncherDescriptors(response);
      })
      .catch(error => {
        setErrorMessage("getLauncherDescriptors::Couldn't get launcher descriptors, error: " + error);
      });
  };

  // Handle page changed
  const handlePageChanged = (newPage) => {
    const newSkip = newPage * pager.itemsOnPage;
    setFilter(prev => ({
      ...prev,
      skip: newSkip
    }));
    setPager(prev => ({
      ...prev,
      current: newPage
    }));
  };

  // Handle filter change
  const handleFilterChange = (fieldName, event, index) => {
    setFilter(prev => {
      const newFilter = { ...prev };
      if (index) {
        if (event.target.value == "") {
          if (newFilter[fieldName]) {
            delete newFilter[fieldName][index];
          }
        } else {
          if (!newFilter[fieldName]) {
            newFilter[fieldName] = {};
          }
          newFilter[fieldName][index] = event.target.value;
        }
      } else {
        if (event.target.value == "") {
          delete newFilter[fieldName];
        } else {
          newFilter[fieldName] = event.target.value;
        }
      }
      return newFilter;
    });
  };

  // Handle from date filter change
  const handleFromDateFilterChange = (value, formattedValue) => {
    setFilter(prev => {
      const newFilter = { ...prev };
      if (value == null) {
        delete newFilter.from_createdTime;
      } else {
        newFilter.from_createdTime = value.getTime();
      }
      return newFilter;
    });
  };

  // Handle to date filter change
  const handleToDateFilterChange = (value, formattedValue) => {
    setFilter(prev => {
      const newFilter = { ...prev };
      if (value == null) {
        delete newFilter.to_createdTime;
      } else {
        newFilter.to_createdTime = value.getTime();
      }
      return newFilter;
    });
  };

  // On filter
  const onFilter = (event) => {
    updateUrl();
    getLaunches();
    getPager();
    event.preventDefault();
  };

  // Update URL
  const updateUrl = () => {
    navigate("/" + projectId + "/launches?" + Utils.filterToQuery(filter));
  };

  // Get progress bar
  const getProgressBar = (launch) => {
    return (
      <div className="progress">
        <ControlledPopup popupMessage={errorMessage} />
        {typeof (launch) != 'undefined' && (
          <>
            <div
              className="progress-bar progress-bar-striped"
              role="progressbar"
              style={Utils.getProgressBarStyle(launch.launchStats.statusCounters.RUNNING, launch.launchStats.total)}
            ></div>
            <div
              className="progress-bar bg-success"
              role="progressbar"
              style={Utils.getProgressBarStyle(launch.launchStats.statusCounters.PASSED, launch.launchStats.total)}
            ></div>
            <div
              className="progress-bar bg-danger"
              role="progressbar"
              style={Utils.getProgressBarStyle(launch.launchStats.statusCounters.FAILED, launch.launchStats.total)}
            ></div>
            <div
              className="progress-bar bg-warning"
              role="progressbar"
              style={Utils.getProgressBarStyle(launch.launchStats.statusCounters.BROKEN, launch.launchStats.total)}
            ></div>
          </>
        )}
      </div>
    );
  };

  // Component mount and filter initialization
  useEffect(() => {
    const initialFilter = Object.assign(
      {
        skip: 0,
        limit: 20,
        orderby: "id",
        orderdir: "DESC",
        includedFields: "name,launchStats,id,createdTime,startTime,finishTime,launcherConfig,duration,testCaseTree",
      },
      Utils.queryToFilter(location.search.substring(1))
    );
    setFilter(initialFilter);
    getLauncherDescriptors();

    // Set up interval for periodic refresh
    intervalRef.current = setInterval(() => {
      getLaunches();
    }, 30000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  // Fetch launches when filter changes
  useEffect(() => {
    getLaunches();
    getPager();
  }, [filter.skip, filter.limit]);

  // Update URL when page changes
  useEffect(() => {
    updateUrl();
  }, [pager.current]);

  return (
    <div className="row">
      <div className="col-sm-3 launch-filter">
        <form>
          <div className="form-group">
            <div className="header-container">
              <label htmlFor="name">
                <h5>Launch Name</h5>
              </label>
              <span className="float-right">
                <Link
                  to={
                    "/" +
                    projectId +
                    "/launches/statistics?" +
                    Utils.filterToQuery(filter)
                  }
                >
                  Statistics
                </Link>
              </span>
            </div>
            <input
              type="text"
              className="form-control"
              id="name"
              name="name"
              aria-describedby="Launch title"
              placeholder="Launch title"
              value={filter.like_name || ""}
              onChange={e => handleFilterChange("like_name", e)}
            />
            <small id="titleHelp" className="form-text text-muted">
              Find by partly matching Launch title
            </small>
          </div>
        </form>
      </div>
      <div className="col-sm-9">
        <div className="sweet-loading">
          <FadeLoader sizeUnit={"px"} size={100} color={"#135f38"} loading={loading} />
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
            {launches.map((launch) => (
              <tr key={launch.id}>
                <td>
                  <Link to={"/" + projectId + "/launch/" + launch.id}>{launch.name}</Link>
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
        <div>
          <Pager
            totalItems={pager.total}
            currentPage={pager.current}
            visiblePages={pager.maxVisiblePage}
            itemsOnPage={pager.itemsOnPage}
            onPageChanged={handlePageChanged}
          />
        </div>
      </div>
    </div>
  );
};

export default Launches;
