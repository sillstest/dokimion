/* eslint-disable react/no-direct-mutation-state */
import React, { Component } from "react";
import SubComponent from "../common/SubComponent";
import * as Utils from "../common/Utils";
import ControlledPopup from "../common/ControlledPopup";
import Highcharts from "highcharts";
import Backend from "../services/backend";
import { FadeLoader } from "react-spinners";

class LaunchesByUserExecutionTrend extends SubComponent {
  state = {
    stats:[],
    launches: [],
    filter: {
      skip: 0,
      limit: 20,
      orderby: "id",
      orderdir: "DESC",
      includedFields: "launchStats,createdTime,testCaseTree",
    },
    loading: true,
    errorMessage: "",
  };

  constructor(props) {
    super(props);
    this.getLaunches = this.getLaunches.bind(this);
    this.getSeries = this.getSeries.bind(this);
    this.getStats = this.getStats.bind(this);
    this.renderChart = this.renderChart.bind(this);
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
        this.getLaunches();
        // this.state.loading = false;
        this.setState(this.state);
      })
      .catch(error => {
        this.setState({errorMessage: "getStats::Couldn't get launch statistics, error: " + error});
        this.state.loading = false;
        this.setState(this.state);
      });
  }



  getLaunches() {
    if (!this.state.projectId) {
      return [];
    }
    Backend.get(this.state.projectId + "/launch?" + Utils.filterToQuery(this.state.filter))
      .then(response => {
        this.state.launches = response.reverse();
        this.state.loading = false;
        //chart is displayed
        this.renderChart();
        this.setState(this.state);
      })
      .catch(error => {
        this.setState({errorMessage: "getLaunches::Couldn't get launches, error: " + error});
        this.state.loading = false;
        this.setState(this.state);
      });
  }

  renderChart() {
    if (typeof(this.state.launches) != 'undefined') {
    Highcharts.chart("exetrend", {
      title: {
        text: "Launches Time Duration Trend",
      },

      yAxis: {
        title: {
          text: "Total Time (H:M)",
        },
        type: 'datetime',
        dateTimeLabelFormats: { //force all formats to be hour:minute:second
          second: '%H:%M',
          minute: '%H:%M',
          hour: '%H:%M',
          day: '%H:%M',
          week: '%H:%M',
          month: '%H:%M',
          year: '%H:%M'
        }
      },

      xAxis: {
        title: {
          text: "Launch Start time",
        },
        categories: this.state.launches.map(launch => Utils.timeToDateNoTime(launch.startTime)),
      },

      legend: {
        layout: "vertical",
        align: "right",
        verticalAlign: "middle",
      },

      tooltip:{
       formatter : function(){

        return  `<div>${this.x} <br>
                <span style='color:${this.point.color}'>\u25CF</span>
                <b> ${this.series.name}: ${Utils.timePassed(this.y)}</b><br/>
                </div>`
      }
      },

      plotOptions: {
        series: {
          label: {
            connectorAllowed: false,
          },
        },
      },
      

      series:  this.getSeries(),
      responsive: {
        rules: [
          {
            condition: {
              maxWidth: 500,
            },
            chartOptions: {
              legend: {
                layout: "horizontal",
                align: "center",
                verticalAlign: "bottom",
              },
            },
          },
        ],
      },
    });
    }
  }


  getSeries() {
   var users = typeof(this.state.stats.all) != 'undefined' &&  Object.keys(this.state.stats.all.users) ?
                Object.keys(this.state.stats.all.users).map(
                  function (user) {
                    return {  name: user , data: [] };
                  }.bind(this),
                ) :[]

    var series =[];
    var totalUserDuration =0;
    var totalDuration = [];
    if(typeof(this.state.launches) != 'undefined' && typeof(this.state.stats.all) != 'undefined' ) {
    this.state.launches.forEach(launch => {
      if(launch.testCaseTree !=null )
      {
        var testCases = [];
        if(launch.testCaseTree.testCases.length >0)
          {
            testCases = launch.testCaseTree.testCases;
          }else if(launch.testCaseTree.children){
              
              launch.testCaseTree.children.forEach(child=> 
                {
                   testCases = testCases.concat(child.testCases)
                })
          }
          if(testCases){
                series =testCases.map(tc =>({launchName:launch.name,  userName: tc.currentUser, duration:tc.duration , total : launch.duration})) 
                // console.log("Series " + JSON.stringify(series));
          }
      }

      for(let i=0;i< users.length ;i++){
        totalUserDuration=0; 
        series.forEach(val => {
          if(users[i].name === val.userName){
          totalUserDuration = totalUserDuration + val.duration;
          }
        })
          users[i].data.push(totalUserDuration);
      }
     
    });


    totalDuration = typeof(this.state.launches) != 'undefined' ? 
    this.state.launches.map(l=>l.duration) : [];
  }
  users.push({name:'Total', data: totalDuration});
    console.log("DATA POINTS : " + JSON.stringify(users));
    return Object.keys(users).map(key => users[key]);
  }

  render() {
    return (
      <div>
        <ControlledPopup popupMessage={this.state.errorMessage}/>
        <div id="exetrend"></div>
        <div id="sweet-loading">
          <FadeLoader sizeUnit={"px"} size={100} color={"#135f38"} loading={this.state.loading} />
        </div>
      </div>
    );
  }
}

export default LaunchesByUserExecutionTrend;
