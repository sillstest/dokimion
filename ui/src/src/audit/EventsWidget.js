import React, { useState, useEffect } from "react";
import * as Utils from "../common/Utils";
import { FadeLoader } from "react-spinners";
import Backend from "../services/backend";
import ControlledPopup from "../common/ControlledPopup";

function EventsWidget({ projectId, filter }) {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (!projectId || !filter || !filter.entityId) return;
    setLoading(true);
    Backend.get(projectId + "/audit?" + Utils.filterToQuery(filter))
      .then(response => {
        setEvents(response);
        setLoading(false);
      })
      .catch(error => {
        setErrorMessage("Couldn't get events: " + error);
        setLoading(false);
      });
  }, [projectId, filter]);

  return (
    <div>
      <ControlledPopup popupMessage={errorMessage} />
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
              <th>Duration</th>
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
                  <td>{event.eventType !== "UPDATED" ? Utils.timePassed(event.duration) : "-"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <div>
          <a href={"/" + projectId + "/audit?" + Utils.filterToQuery(filter || {})} target="_blank" rel="noreferrer">
            All Events
          </a>
        </div>
      </div>
    </div>
  );
}

export default EventsWidget;
