import React, { useState, useEffect } from "react";
import * as Utils from "../common/Utils";
import { FadeLoader } from "react-spinners";
import Backend from "../services/backend";
import ControlledPopup from "../common/ControlledPopup";

const EventsWidget = ({ projectId: propProjectId, filter: propFilter }) => {
  const [events, setEvents] = useState([]);
  const [projectId, setProjectId] = useState("");
  const [filter, setFilter] = useState(null);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // Sync props into local state when they change
  useEffect(() => {
    if (propProjectId) {
      setProjectId(propProjectId);
    }
  }, [propProjectId]);

  useEffect(() => {
    if (propFilter) {
      setFilter(propFilter);
    }
  }, [propFilter]);

  // Fetch events when both projectId and filter are available
  useEffect(() => {
    if (!projectId || !filter) return;

    setLoading(true);
    setErrorMessage("");

    Backend.get(`${projectId}/audit?${Utils.filterToQuery(filter)}`)
      .then((response) => {
        setEvents(response);
        setLoading(false);
      })
      .catch((error) => {
        setErrorMessage(`getEvents::Couldn't get events, error: ${error}`);
        setLoading(false);
      });
  }, [projectId, filter]);

  return (
    <div>
      <ControlledPopup popupMessage={errorMessage} />

      <div className="col-sm-9">
        {/* Loading Spinner */}
        <div className="sweet-loading">
          <FadeLoader
            sizeUnit={"px"}
            size={100}
            color={"#135f38"}
            loading={loading}
          />
        </div>

        {/* Events Table */}
        <table className="table">
          <thead>
            <tr>
              <th scope="col">Type</th>
              <th scope="col">Date</th>
              <th>User</th>
              <th>Duration</th>
            </tr>
          </thead>
          <tbody>
            {events.map((event, i) => {
              const eventUser =
                event.createdBy || event.lastModifiedBy || event.user || "";

              return (
                <tr
                  key={event.id || i} // Prefer event.id if available
                  className={Utils.getStatusColorClass(event.eventType)}
                >
                  <td>{event.eventType}</td>
                  <td>{Utils.timeToDate(event.createdTime)}</td>
                  <td>{eventUser}</td>
                  <td>
                    {event.eventType !== "UPDATED"
                      ? Utils.timePassed(event.duration)
                      : "-"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {/* Link to full audit log */}
        {projectId && filter && (
          <div>
            <a
              href={`/${projectId}/audit?${Utils.filterToQuery(filter)}`}
              target="_blank"
              rel="noreferrer"
            >
              All Events
            </a>
          </div>
        )}
      </div>
    </div>
  );
};

export default EventsWidget;
