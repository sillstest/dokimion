/* eslint-disable eqeqeq */
import { withRouter } from "../common/withRouter";
import React, { useState, useEffect, useCallback } from "react";
import Pager from "../pager/Pager";
import * as Utils from "../common/Utils";
import { FadeLoader } from "react-spinners";
import DatePicker from "react-date-picker";
import Select from "react-select";
import Backend from "../services/backend";
import ControlledPopup from "../common/ControlledPopup";

const ALL_EVENT_TYPES = ["PASSED", "FAILED", "BROKEN", "UPDATED"];
const ENTITY_TYPES = ["TestCase"];
const ITEMS_ON_PAGE = 20;
const MAX_VISIBLE_PAGES = 7;

function Events({ match, history, location }) {
  const project = match?.params?.project;

  const [filter, setFilter] = useState(() => {
    const f = {
      skip: 0,
      limit: ITEMS_ON_PAGE,
      orderby: "id",
      orderdir: "DESC",
      entityType: "",
      entityId: "",
      eventType: [...ALL_EVENT_TYPES],
    };
    const parsed = Utils.queryToFilter(location.search.substring(1));
    Object.assign(f, parsed);
    if (f.eventType && !Array.isArray(f.eventType)) f.eventType = [f.eventType];
    return f;
  });
  const [events, setEvents] = useState([]);
  const [pagerTotal, setPagerTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  const fetchEvents = useCallback(
    f => {
      setLoading(true);
      Backend.get(project + "/audit?" + Utils.filterToQuery(f))
        .then(response => {
          setEvents(response);
          setLoading(false);
        })
        .catch(error => {
          setErrorMessage("Couldn't get events: " + error);
          setLoading(false);
        });
    },
    [project],
  );

  const fetchCount = useCallback(
    f => {
      const countFilter = { ...f, skip: 0, limit: 0 };
      Backend.get(project + "/audit/count?" + Utils.filterToQuery(countFilter))
        .then(response => setPagerTotal(response))
        .catch(error => console.log(error));
    },
    [project],
  );

  useEffect(() => {
    fetchEvents(filter);
    fetchCount(filter);
    // Mount-only initial load (former componentDidMount); filter changes refetch explicitly elsewhere.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function updateUrl(f) {
    history.push("/" + project + "/audit?" + Utils.filterToQuery(f));
  }

  function handlePageChanged(newPage) {
    const updated = { ...filter, skip: newPage * ITEMS_ON_PAGE };
    setFilter(updated);
    setCurrentPage(newPage);
    fetchEvents(updated);
    updateUrl(updated);
  }

  function handleFilterChange(fieldName, event) {
    const val = event.target.value;
    setFilter(prev => {
      const updated = { ...prev };
      if (val === "") delete updated[fieldName];
      else updated[fieldName] = val;
      return updated;
    });
  }

  function handleFromDateFilterChange(value) {
    setFilter(prev => {
      const updated = { ...prev };
      if (value == null) delete updated.from_createdTime;
      else updated.from_createdTime = value.getTime();
      return updated;
    });
  }

  function handleToDateFilterChange(value) {
    setFilter(prev => {
      const updated = { ...prev };
      if (value == null) delete updated.to_createdTime;
      else updated.to_createdTime = value.getTime();
      return updated;
    });
  }

  function handleTypesChanged(values) {
    setFilter(prev => ({ ...prev, eventType: (values || []).map(v => v.value) }));
  }

  function onFilter(event) {
    fetchEvents(filter);
    fetchCount(filter);
    updateUrl(filter);
    event.preventDefault();
  }

  return (
    <div className="row">
      <ControlledPopup popupMessage={errorMessage} />
      <div className="col-sm-3 events-filter">
        <form>
          <div className="form-group">
            <label>
              <h5>Event Time</h5>
            </label>
            <div className="input-group mb-2">
              <DatePicker
                id="from_createdTime"
                value={Utils.getDatepickerTime(filter.from_createdTime)}
                onChange={handleFromDateFilterChange}
              />
              <DatePicker
                id="to_createdTime"
                value={Utils.getDatepickerTime(filter.to_createdTime)}
                onChange={handleToDateFilterChange}
              />
            </div>
          </div>
          <div className="form-group">
            <label>
              <h5>Event Type</h5>
            </label>
            <Select
              value={(filter.eventType || []).map(val => ({ value: val, label: val }))}
              isMulti
              onChange={handleTypesChanged}
              options={ALL_EVENT_TYPES.map(val => ({ value: val, label: val }))}
            />
          </div>
          <div className="form-group">
            <label>
              <h5>Entity Type</h5>
            </label>
            <div className="input-group mb-2">
              <select id="launcher-select" className="form-control" onChange={e => handleFilterChange("entityType", e)}>
                <option> </option>
                {ENTITY_TYPES.map(entityType => (
                  <option key={entityType} value={entityType} selected={filter.entityType == entityType}>
                    {entityType}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="form-group">
            <label>
              <h5>Entity Id</h5>
            </label>
            <input
              type="text"
              className="form-control"
              id="entityId"
              name="entityId"
              aria-describedby="Event Entity Id"
              value={filter.entityId || ""}
              onChange={e => handleFilterChange("entityId", e)}
            />
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
        <table className="table">
          <thead>
            <tr>
              <th scope="col">Type</th>
              <th scope="col">Date</th>
              <th>User</th>
            </tr>
          </thead>
          <tbody>
            {events.map((event, i) => {
              const eventUser = event.createdBy || event.lastModifiedBy || event.user || "";
              return (
                <tr key={i} className={Utils.getStatusColorClass(event.eventType)}>
                  <td>{event.eventType}</td>
                  <td>{Utils.timeToDate(event.createdTime)}</td>
                  <td>{eventUser}</td>
                </tr>
              );
            })}
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

export default withRouter(Events);
