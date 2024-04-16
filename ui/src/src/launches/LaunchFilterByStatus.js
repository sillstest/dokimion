/* eslint-disable eqeqeq */
/* eslint-disable react/no-direct-mutation-state */
import React, { Component } from "react";
require("gijgo/js/gijgo.min.js");
require("gijgo/css/gijgo.min.css");

class LaunchFilterByStatus extends Component {
  defaultFailureDetails = { text: "" };

  LAUNCH_STATUS = Object.freeze({
    PASSED: 'PASSED',
    FAILED: 'FAILED',
    BROKEN: 'BROKEN',
    RUNNABLE: 'RUNNABLE',
  });

  state = {
    launchStats: {
      statusCounters: {},
    },

    passButtonCounter: 0,
    failButtonCounter: 0,
    brokenButtonCounter: 0,
    NotrunButtonCounter: 0,

    errorMessage: "",
    filterLaunch: [],
  };

  constructor(props) {
    super(props);
    this.state.launchStats = this.props.launchStats;
    this.handleSubmit = this.handleSubmit.bind(this);
  }

  componentDidMount() {
    // super.componentDidMount();
    this.callback = this.props.callback;
    // this.setState(this.sstate);
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.launchStats) {
      // console.log("Here in props chnabe" + JSON.stringify(nextProps.launchStats));
      this.state.launchStats = nextProps.launchStats;
    }
    this.setState(this.state);
  }

  handleSubmit(status, event) {

    switch (status) {
      case this.LAUNCH_STATUS.PASSED:
        if (this.state.launchStats.statusCounters.PASSED > 0) {
          this.state.filterLaunch.push(this.LAUNCH_STATUS.PASSED);
          this.state.passButtonCounter++;
        }
        if (this.state.passButtonCounter > 1) {
          this.state.filterLaunch = this.state.filterLaunch.filter((stat) => stat !== status);
          this.state.passButtonCounter = 0;
        }
        break;
      case this.LAUNCH_STATUS.FAILED:
        if (this.state.launchStats.statusCounters.FAILED > 0) {
          this.state.filterLaunch.push(this.LAUNCH_STATUS.FAILED);
          this.state.failButtonCounter++;
        }
        if (this.state.failButtonCounter > 1) {
          this.state.filterLaunch = this.state.filterLaunch.filter((stat) => stat !== status);
          this.state.failButtonCounter = 0;
        }
        break;
      case this.LAUNCH_STATUS.BROKEN:
        if (this.state.launchStats.statusCounters.BROKEN > 0) {

          this.state.filterLaunch.push(this.LAUNCH_STATUS.BROKEN);
          this.state.brokenButtonCounter++
        }

        if (this.state.brokenButtonCounter > 1) {
          this.state.filterLaunch = this.state.filterLaunch.filter((stat) => stat !== status);
          this.state.brokenButtonCounter = 0;
        }
        break;
      case this.LAUNCH_STATUS.RUNNABLE:
        if (this.state.launchStats.statusCounters.RUNNABLE > 0) {
          this.state.filterLaunch.push(this.LAUNCH_STATUS.RUNNABLE);
          this.state.NotrunButtonCounter++;
        }
        if (this.state.NotrunButtonCounter > 1) {
          this.state.filterLaunch = this.state.filterLaunch.filter((stat) => stat !== status);
          this.state.NotrunButtonCounter = 0;
        }
        break;
      default:
        console.log(`Wrong selection`);
    }
    this.setState(this.state);
    this.props.callback(true, this.state.filterLaunch);
    event.preventDefault();
  }




  render() {

    return (
      <div className="col-6 btn-group" role="group">
        <button type="button" className={this.state.passButtonCounter === 0 ? 'btn btn-success' : 'btn btn-success disabled'}
          onClick={e => this.handleSubmit("PASSED", e)} >
          Passed &nbsp;
          <span className="badge badge-light text-dark" > {this.state.launchStats.statusCounters.PASSED}
          </span>
        </button>
        <button type="button" className={this.state.failButtonCounter === 0 ? 'btn btn-danger' : 'btn btn-danger disabled'}
          onClick={e => this.handleSubmit(this.LAUNCH_STATUS.FAILED, e)} >
          Fail  &nbsp;
          <span className="badge badge-light text-dark" > {this.state.launchStats.statusCounters.FAILED}
          </span>
        </button>
        <button type="button" className={this.state.brokenButtonCounter === 0 ? 'btn btn-warning' : 'btn btn-warning disabled'}
          onClick={e => this.handleSubmit(this.LAUNCH_STATUS.BROKEN, e)} >
          Broken &nbsp;<span className="badge badge-light text-dark" > {this.state.launchStats.statusCounters.BROKEN}
          </span>
        </button>
        <button type="button" className={this.state.NotrunButtonCounter === 0 ? 'btn btn-secondary' : 'btn btn-secondary disabled'}
          onClick={e => this.handleSubmit(this.LAUNCH_STATUS.RUNNABLE, e)} >
          Not Run &nbsp;
          <span className="badge badge-light text-dark" > {this.state.launchStats.statusCounters.RUNNABLE}
          </span>
        </button>
      </div>
    );
  }
}

export default LaunchFilterByStatus;
