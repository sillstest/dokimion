import React from "react";
import SubComponent from "../common/SubComponent";
import * as Utils from "../common/Utils";
import { FadeLoader } from "react-spinners";
import Highcharts from "highcharts";
import Backend from "../services/backend";
import ControlledPopup from "../common/ControlledPopup";

class LaunchesByUsersPieWidget extends SubComponent {
  state = {
    launches: [],
    filter: {
      skip: 0,
      limit: 20,
      orderby: "id",
      orderdir: "ASC",
      includedFields: "launchStats,createdTime",
    },
    loading: true,
    errorMessage: "",
  };

  constructor(props) {
    super(props);
    this.getStats = this.getStats.bind(this);
    this.setUpUsersPieSeries = this.setUpUsersPieSeries.bind(this);
    this.usersPieChartRender = this.usersPieChartRender.bind(this);
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.projectId) {
      this.state.projectId = nextProps.projectId;
    }
    if (nextProps.filter) {
      this.state.filter = nextProps.filter;
    }
    this.getStats();
  }

  componentDidMount() {
    super.componentDidMount();
    this.getStats();
  }

  getStats() {
    if (!this.state.projectId) {
      return [];
    }
    Backend.get(this.state.projectId + "/launch/statistics?" + Utils.filterToQuery(this.state.filter))
      .then(response => {
        this.state.stats = response;
        this.setUpUsersPieSeries();
        this.state.loading = false;
        this.setState(this.state);
        this.usersPieChartRender();
      })
      .catch(error => {
        this.setState({errorMessage: "getStats::Couldn't get launch statistics"});
        this.state.loading = false;
        this.setState(this.state);
      });
  }

  setUpUsersPieSeries() {
    if (typeof(this.state.stats.all) != 'undefined') {
    this.state.userSeries = [
      {
        name: "Statuses",
        data: typeof(this.state.stats.all) != 'undefined' && Object.keys(this.state.stats.all.users).map(
          function (user) {
            return { name: user, y: this.state.stats.all.users[user] };
          }.bind(this),
        ),
      },
    ];
    }
  }

  usersPieChartRender() {
    if (typeof(this.state.stats.all) != 'undefined') {
    Highcharts.chart({
      chart: {
        type: "pie",
        renderTo: "pie-by-users",
      },
      title: {
        verticalAlign: "middle",
        floating: true,
        text: "Users",
        style: {
          fontSize: "10px",
        },
      },
      plotOptions: {
        pie: {
          dataLabels: {
            format: "{point.name}: {point.percentage:.1f} %",
          },
          innerSize: "70%",
        },
      },
      series: this.state.userSeries,
    });
    }
  }

  render() {
    return (
      <div>
        <ControlledPopup popupMessage={this.state.errorMessage}/>
        <div id="pie-by-users"></div>
        <div id="sweet-loading">
          <FadeLoader sizeUnit={"px"} size={100} color={"#135f38"} loading={this.state.loading} />
        </div>
      </div>
    );
  }
}

export default LaunchesByUsersPieWidget;
