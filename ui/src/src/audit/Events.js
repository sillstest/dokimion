/* eslint-disable eqeqeq */
import React from "react";
import SubComponent from "../common/SubComponent";
import Pager from "../pager/Pager";
import * as Utils from "../common/Utils";
import { FadeLoader } from "react-spinners";
import DatePicker from "react-date-picker";
import Select from "react-select";
import Backend from "../services/backend";
import ControlledPopup from "../common/ControlledPopup";

class Events extends SubComponent {
  state = {
    events: [],
    allEventTypes: ["PASSED", "FAILED", "BROKEN", "UPDATED"],
    entityTypes: ["TestCase"],
    filter: {
      skip: 0,
      limit: 20,
      orderby: "id",
      orderdir: "DESC",
      entityType: "",
      entityId: "",
      eventType: ["PASSED", "FAILED", "BROKEN", "UPDATED"],
    },
    pager: {
      total: 0,
      current: 0,
      maxVisiblePage: 7,
      itemsOnPage: 20,
    },
    loading: true,
    errorMessage: "",
  };

  constructor(props) {
    super(props);
    this.getEvents = this.getEvents.bind(this);
    this.getPager = this.getPager.bind(this);
    this.handlePageChanged = this.handlePageChanged.bind(this);
    this.updateUrl = this.updateUrl.bind(this);
    this.onFilter = this.onFilter.bind(this);
    this.handleFilterChange = this.handleFilterChange.bind(this);
    this.handleFromDateFilterChange = this.handleFromDateFilterChange.bind(this);
    this.handleToDateFilterChange = this.handleToDateFilterChange.bind(this);
    this.handleTypesChanged = this.handleTypesChanged.bind(this);
  }

  componentDidMount() {
    super.componentDidMount();
    this.state.filter = Object.assign(this.state.filter, Utils.queryToFilter(this.props.location.search.substring(1)));
    if (this.state.filter.eventType && !Array.isArray(this.state.filter.eventType)) {
      this.state.filter.eventType = [this.state.filter.eventType];
    }
    this.state.entityUrl = this.props.entityUrl;
    this.state.entityName = this.props.entityName;
    this.getEvents();
    this.getPager();
  }

  getEvents() {
    Backend.get(this.props.match.params.project + "/audit?" + Utils.filterToQuery(this.state.filter))
      .then(response => {
        this.state.events = response;
        this.state.loading = false;
        this.setState(this.state);
      })
      .catch(error => {
        this.setState({errorMessage: "Couldn't get events"});
        this.state.loading = false;
        this.setState(this.state);
      });
  }

  handlePageChanged(newPage) {
    this.state.pager.current = newPage;
    this.state.filter.skip = newPage * this.state.pager.itemsOnPage;
    this.getEvents();
    this.setState(this.state);
    this.updateUrl();
  }

  getPager() {
    var countFilter = Object.assign({ skip: 0, limit: 0 }, this.state.filter);
    Backend.get(this.props.match.params.project + "/audit/count?" + Utils.filterToQuery(countFilter))
      .then(response => {
        this.state.pager.total = response;
        this.state.pager.current = this.state.filter.skip / this.state.filter.limit;
        this.state.pager.visiblePage = Math.min(
          response / this.state.pager.itemsOnPage + 1,
          this.state.pager.maxVisiblePage,
        );
        this.setState(this.state);
      })
      .catch(error => console.log(error));
  }

  handleFilterChange(fieldName, event, index) {
    if (index) {
      if (event.target.value == "") {
        delete this.state.filter[fieldName][index];
      } else {
        this.state.filter[fieldName][index] = event.target.value;
      }
    } else {
      if (event.target.value == "") {
        delete this.state.filter[fieldName];
      } else {
        this.state.filter[fieldName] = event.target.value;
      }
    }
    this.setState(this.state);
  }

  handleFromDateFilterChange(value, formattedValue) {
    if (value == null) {
      delete this.state.filter.from_createdTime;
    } else {
      this.state.filter.from_createdTime = value.getTime();
    }
    this.setState(this.state);
  }

  handleToDateFilterChange(value, formattedValue) {
    if (value == null) {
      delete this.state.filter.to_createdTime;
    } else {
      this.state.filter.to_createdTime = value.getTime();
    }
    this.setState(this.state);
  }

  handleTypesChanged(values) {
    this.state.filter.eventType = values.map(function (value) {
      return value.value;
    });
    this.setState(this.state);
  }

  onFilter(event) {
    this.updateUrl();
    this.getEvents();
    this.getPager();
    event.preventDefault();
  }

  updateUrl() {
    this.props.history.push("/" + this.props.match.params.project + "/audit?" + Utils.filterToQuery(this.state.filter));
  }

  render() {
    return (
      <div className="row">
        <ControlledPopup popupMessage={this.state.errorMessage}/>
        <div className="col-sm-3 events-filter">
          <form>
            <div class="form-group">
              <label for="created">
                <h5>Event Time</h5>
              </label>
              <div class="input-group mb-2">
                <DatePicker
                  id="from_createdTime"
                  value={Utils.getDatepickerTime(this.state.filter.from_createdTime)}
                  onChange={this.handleFromDateFilterChange}
                  placeholder="Event after"
                />
                <DatePicker
                  id="to_createdTime"
                  value={Utils.getDatepickerTime(this.state.filter.to_createdTime)}
                  onChange={this.handleToDateFilterChange}
                  placeholder="Event before"
                />
              </div>
            </div>
            <div class="form-group">
              <label for="created">
                <h5>Event Type</h5>
              </label>
              <div>
                <Select
                  value={this.state.filter.eventType.map(function (val) {
                    return { value: val, label: val };
                  })}
                  isMulti
                  onChange={this.handleTypesChanged}
                  options={this.state.allEventTypes.map(function (val) {
                    return { value: val, label: val };
                  })}
                />
              </div>
            </div>

            <div class="form-group">
              <label for="created">
                <h5>Entity Type</h5>
              </label>
              <div class="input-group mb-2">
                <select
                  id="launcher-select"
                  className="form-control"
                  onChange={e => this.handleFilterChange("entityType", e)}
                >
                  <option> </option>
                  {this.state.entityTypes.map(
                    function (entityType) {
                      var selected = this.state.filter.entityType == entityType;
                      if (selected) {
                        return (
                          <option value={entityType} selected>
                            {entityType}
                          </option>
                        );
                      }
                      return <option value={entityType}>{entityType}</option>;
                    }.bind(this),
                  )}
                </select>
              </div>
            </div>
            <div class="form-group">
              <label for="title">
                <h5>Entity Id</h5>
              </label>
              <input
                type="text"
                class="form-control"
                id="entityId"
                name="entityId"
                aria-describedby="Event Entity Id"
                placeholder="Event Entity Id"
                value={this.state.filter.entityId || ""}
                onChange={e => this.handleFilterChange("entityId", e)}
              />
            </div>
            <button type="submit" class="btn btn-primary" onClick={this.onFilter}>
              Filter
            </button>
          </form>
        </div>

        <div className="col-sm-9">
          <div className="sweet-loading">
            <FadeLoader sizeUnit={"px"} size={100} color={"#135f38"} loading={this.state.loading} />
          </div>
          <table class="table">
            <thead>
              <tr>
                <th scope="col">Type</th>
                <th scope="col">Date</th>
                <th>User</th>
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
                  </tr>
                );
              })}
            </tbody>
          </table>
          <div>
            <Pager
              totalItems={this.state.pager.total}
              currentPage={this.state.pager.current}
              visiblePages={this.state.pager.maxVisiblePage}
              itemsOnPage={this.state.pager.itemsOnPage}
              onPageChanged={this.handlePageChanged}
            />
          </div>
        </div>
      </div>
    );
  }
}

export default Events;
