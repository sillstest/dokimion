import React from "react";
import SubComponent from "../common/SubComponent";
import { Link } from "react-router-dom";
import * as Utils from "../common/Utils";
import { FadeLoader } from "react-spinners";
import Backend from "../services/backend";
import ControlledPopup from "../common/ControlledPopup";

class LaunchesWidget extends SubComponent {
  state = {
    launches: [],
    loading: true,
    errorMessage: "",
  };

  constructor(props) {
    super(props);
    this.limit = props.limit || 5;
    this.state.projectId = props.projectId;
    this.getLaunches = this.getLaunches.bind(this);
  }

  componentDidMount() {
    super.componentDidMount();
    if (this.state.projectId) {
      this.getLaunches();
    }
  }

  UNSAFE_componentWillReceiveProps(nextProps) {
    var nextProjectId = nextProps.projectId;
    // eslint-disable-next-line eqeqeq
    if (nextProjectId && this.state.projectId != nextProjectId) {
      this.state.projectId = nextProjectId;
      this.getLaunches();
    }
  }

  getLaunches() {
    Backend.get(
      this.state.projectId + "/launch?includedFields=name,id,launchStats&orderby=id&orderdir=DESC&limit=" + this.limit,
    )
      .then(response => {
        this.state.launches = response;
        this.state.loading = false;
        this.setState(this.state);
      })
      .catch(error => {
        this.setState({errorMessage: "getLaunches::Couldn't get launch, error: " + error});
        this.state.loading = false;
        this.setState(this.state);
      });
  }

  getProgressBar(launch) {
    return (
      <div className="progress">
        <ControlledPopup popupMessage={this.state.errorMessage}/>
        <div
          className="progress-bar progress-bar-striped"
          role="progressbar"
          style={this.getProgressStyle(launch.launchStats.statusCounters.RUNNING, launch.launchStats.total)}
        ></div>
        <div
          className="progress-bar bg-success"
          role="progressbar"
          style={this.getProgressStyle(launch.launchStats.statusCounters.PASSED, launch.launchStats.total)}
        ></div>
        <div
          className="progress-bar bg-danger"
          role="progressbar"
          style={this.getProgressStyle(launch.launchStats.statusCounters.FAILED, launch.launchStats.total)}
        ></div>
        <div
          className="progress-bar bg-warning"
          role="progressbar"
          style={this.getProgressStyle(launch.launchStats.statusCounters.BROKEN, launch.launchStats.total)}
        ></div>
      </div>
    );
  }

  getProgressStyle(value, total) {
    return { width: (value * 100) / total + "%" };
  }

  render() {
    return (
      <div>
        <div className="sweet-loading">
          <FadeLoader sizeUnit={"px"} size={100} color={"#135f38"} loading={this.state.loading} />
        </div>
        <table className="table table-striped">
          <thead>
            <tr>
              <th scope="col">Title</th>
              <th scope="col">Progress</th>
            </tr>
          </thead>
          <tbody>
            {this.state.launches.map(
              function (launch, index) {
                return (
                  <tr key={index}>
                    <td>
                      <Link key={index} to={"/" + this.state.projectId + "/launch/" + launch.id}>{launch.name}</Link>
                    </td>
                    <td>{this.getProgressBar(launch)}</td>
                  </tr>
                );
              }.bind(this),
            )}
          </tbody>
        </table>
      </div>
    );
  }
}

export default LaunchesWidget;
