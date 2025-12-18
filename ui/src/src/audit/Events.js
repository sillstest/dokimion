import React, { useState, useEffect, useCallback } from "react";
import SubComponent from "../common/SubComponent";
import Pager from "../pager/Pager";
import * as Utils from "../common/Utils";
import { FadeLoader } from "react-spinners";
import DatePicker from "react-date-picker";
import Select from "react-select";
import Backend from "../services/backend";
import ControlledPopup from "../common/ControlledPopup";
import { useParams, useSearchParams, useNavigate } from "react-router-dom";

const Events = ({ entityUrl, entityName }) => {
  const { project } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const allEventTypes = ["PASSED", "FAILED", "BROKEN", "UPDATED"];
  const entityTypes = ["TestCase"];

  const [events, setEvents] = useState([]);
  const [filter, setFilter] = useState({
    skip: 0,
    limit: 20,
    orderby: "id",
    orderdir: "DESC",
    entityType: "",
    entityId: "",
    eventType: ["PASSED", "FAILED", "BROKEN", "UPDATED"],
  });
  const [pager, setPager] = useState({
    total: 0,
    current: 0,
    maxVisiblePage: 7,
    itemsOnPage: 20,
  });
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  // Load filter from URL on mount
  useEffect(() => {
    const urlFilter = Utils.queryToFilter(searchParams.toString());
    let newFilter = { ...filter, ...urlFilter };

    if (newFilter.eventType && !Array.isArray(newFilter.eventType)) {
      newFilter.eventType = [newFilter.eventType];
    }

    setFilter(newFilter);
  }, [searchParams]);

  // Fetch events when filter changes
  const getEvents = useCallback(() => {
    if (!project) return;

    setLoading(true);
    setErrorMessage("");

    Backend.get(`${project}/audit?${Utils.filterToQuery(filter)}`)
      .then((response) => {
        setEvents(response);
        setLoading(false);
      })
      .catch((error) => {
        setErrorMessage(`getEvents::Couldn't get events, error: ${error}`);
        setLoading(false);
      });
  }, [project, filter]);

  // Fetch total count for pager
  const getPager = useCallback(() => {
    if (!project) return;

    const countFilter = { ...filter, skip: 0, limit: 0 };
    Backend.get(`${project}/audit/count?${Utils.filterToQuery(countFilter)}`)
      .then((total) => {
        setPager((prev) => ({
          ...prev,
          total,
          current: filter.skip / filter.limit,
          visiblePage: Math.min(
            Math.ceil(total / prev.itemsOnPage),
            prev.maxVisiblePage
          ),
        }));
      })
      .catch((error) => console.log("Error fetching count:", error));
  }, [project, filter]);

  useEffect(() => {
    getEvents();
    getPager();
  }, [getEvents, getPager]);

  // Update URL with current filter
  const updateUrl = () => {
    const query = Utils.filterToQuery(filter);
    navigate(`/${project}/audit?${query}`);
  };

  // Handle pagination
  const handlePageChanged = (newPage) => {
    const newSkip = newPage * pager.itemsOnPage;
    setFilter((prev) => ({ ...prev, skip: newSkip }));
    setPager((prev) => ({ ...prev, current: newPage }));
    updateUrl();
  };

  // Generic filter field change
  const handleFilterChange = (fieldName, value) => {
    setFilter((prev) => {
      const newFilter = { ...prev };
      if (value === "" || value == null) {
        delete newFilter[fieldName];
      } else {
        newFilter[fieldName] = value;
      }
      return newFilter;
    });
  };

  // Date filters
  const handleFromDateFilterChange = (date) => {
    setFilter((prev) => ({
      ...prev,
      from_createdTime: date ? date.getTime() : undefined,
    }));
  };

  const handleToDateFilterChange = (date) => {
    setFilter((prev) => ({
      ...prev,
      to_createdTime: date ? date.getTime() : undefined,
    }));
  };

  // Event types multi-select
  const handleTypesChanged = (selectedOptions) => {
    const values = selectedOptions ? selectedOptions.map((opt) => opt.value) : [];
    setFilter((prev) => ({ ...prev, eventType: values }));
  };

  // Apply filter
  const onFilter = (e) => {
    e.preventDefault();
    setFilter((prev) => ({ ...prev, skip: 0 })); // Reset to first page
    updateUrl();
  };

  return (
    <div className="row">
      <ControlledPopup popupMessage={errorMessage} />

      {/* Filter Sidebar */}
      <div className="col-sm-3 events-filter">
        <form onSubmit={onFilter}>
          <div className="form-group">
            <label>
              <h5>Event Time</h5>
            </label>
            <div className="input-group mb-2">
              <DatePicker
                value={Utils.getDatepickerTime(filter.from_createdTime)}
                onChange={handleFromDateFilterChange}
                clearIcon={null}
                format="y-MM-dd"
                className="form-control"
              />
              <DatePicker
                value={Utils.getDatepickerTime(filter.to_createdTime)}
                onChange={handleToDateFilterChange}
                clearIcon={null}
                format="y-MM-dd"
                className="form-control ml-2"
              />
            </div>
          </div>

          <div className="form-group">
            <label>
              <h5>Event Type</h5>
            </label>
            <Select
              isMulti
              value={filter.eventType?.map((val) => ({ value: val, label: val }))}
              onChange={handleTypesChanged}
              options={allEventTypes.map((val) => ({ value: val, label: val }))}
            />
          </div>

          <div className="form-group">
            <label>
              <h5>Entity Type</h5>
            </label>
            <select
              className="form-control"
              value={filter.entityType || ""}
              onChange={(e) => handleFilterChange("entityType", e.target.value)}
            >
              <option value=""> </option>
              {entityTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>
              <h5>Entity Id</h5>
            </label>
            <input
              type="text"
              className="form-control"
              placeholder="Event Entity Id"
              value={filter.entityId || ""}
              onChange={(e) => handleFilterChange("entityId", e.target.value)}
            />
          </div>

          <button type="submit" className="btn btn-primary">
            Filter
          </button>
        </form>
      </div>

      {/* Events Table */}
      <div className="col-sm-9">
        <div className="sweet-loading">
          <FadeLoader
            sizeUnit={"px"}
            size={100}
            color={"#135f38"}
            loading={loading}
          />
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
              const eventUser =
                event.createdBy || event.lastModifiedBy || event.user || "";

              return (
                <tr
                  key={event.id || i}
                  className={Utils.getStatusColorClass(event.eventType)}
                >
                  <td>{event.eventType}</td>
                  <td>{Utils.timeToDate(event.createdTime)}</td>
                  <td>{eventUser}</td>
                </tr>
              );
            })}
          </tbody>
        </table>

        <Pager
          totalItems={pager.total}
          currentPage={pager.current}
          visiblePages={pager.maxVisiblePage}
          itemsOnPage={pager.itemsOnPage}
          onPageChanged={handlePageChanged}
        />
      </div>
    </div>
  );
};

export default Events;
