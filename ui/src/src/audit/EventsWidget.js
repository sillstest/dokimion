/* eslint-disable react/no-direct-mutation-state */
import React, { Component } from "react";
import * as Utils from "../common/Utils";
import { FadeLoader } from "react-spinners";
import Backend from "../services/backend";
import ControlledPopup from "../common/ControlledPopup";

class EventsWidget extends Component {
  constructor(props) {
    super(props);

    this.state = {
      events: [],
      projectId: "",
      errorMessage: "",
    };
  }

  getEvents() {
    Backend.get(this.state.projectId + "/audit?" + Utils.filterToQuery(this.state.filter))
      .then(response => {
        this.state.events = response;
        this.state.loading = false;
        this.setState(this.state);
      })
      .catch(error => {
        this.setState({errorMessage: "getEvents::Couldn't get events, error: " + error});
        this.state.loading = false;
        this.setState(this.state);
      });

  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.projectId) {
      this.state.projectId = nextProps.projectId;
    }
    if (nextProps.filter) {
      this.state.filter = nextProps.filter;
    }
    if (this.state.filter && this.state.projectId) {
      this.getEvents();
    }
}

  render() {

    return (
      <div>
        <ControlledPopup popupMessage={this.state.errorMessage}/>
        <div className="col-sm-9">
          <div className="sweet-loading">
            <FadeLoader sizeUnit={"px"} size={100} color={"#135f38"} loading={this.state.loading} />
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
          
            

              {this.state.events.map(function (event, i) {
                let eventUser = "";
                if (event.createdBy) {
                  eventUser = event.createdBy;
                } else if (event.lastModifiedBy) {
                  eventUser = event.lastModifiedBy;
                } else {
                  eventUser = event.user;
                }

                return (
                  <tr key={i} className={Utils.getStatusColorClass(event.eventType)}>
                    <td>{event.eventType}</td>
                    <td>{Utils.timeToDate(event.createdTime)}</td>
                    <td>{eventUser}</td>
                    <td>
                      {(event.eventType !=="UPDATED" ) ? 
                      
                      Utils.timePassed(event.duration) : "-"}
                      </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          <div>
            <a
              href={"/" + this.state.projectId + "/audit?" + Utils.filterToQuery(this.state.filter || {})}
              target="_blank"
              rel="noreferrer"
            >
              All Events
            </a>
          </div>
        </div>
      </div>
    );
  }
}

export default EventsWidget;
