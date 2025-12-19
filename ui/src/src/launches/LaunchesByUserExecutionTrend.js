import React, { useState, useEffect } from "react";
import * as Utils from "../common/Utils";
import ControlledPopup from "../common/ControlledPopup";
import Highcharts from "highcharts";
import HighchartsReact from "highcharts-react-official";
import Backend from "../services/backend";
import { FadeLoader } from "react-spinners";

const LaunchesByUserExecutionTrend = ({ projectId, filter: propFilter }) => {
  const [stats, setStats] = useState([]);
  const [launches, setLaunches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  const defaultFilter = {
    skip: 0,
    limit: 20,
    orderby: "id",
    orderdir: "DESC",
    includedFields: "launchStats,createdTime,testCaseTree",
  };

  const filter = { ...defaultFilter, ...propFilter };

  const getSeries = (launchesData, statsData) => {
    const users = statsData?.all?.users 
      ? Object.keys(statsData.all.users).map(user => ({
          name: user,
          data: []
        }))
      : [];

    const totalDuration = [];

    if (launchesData && statsData?.all) {
      launchesData.forEach(launch => {
        if (launch.testCaseTree != null) {
          let testCases = [];
          
          if (launch.testCaseTree.testCases?.length > 0) {
            testCases = launch.testCaseTree.testCases;
          } else if (launch.testCaseTree.children) {
            launch.testCaseTree.children.forEach(child => {
              testCases = testCases.concat(child.testCases || []);
            });
          }

          if (testCases) {
            const series = testCases.map(tc => ({
              launchName: launch.name,
              userName: tc.currentUser,
              duration: tc.duration,
              total: launch.duration
            }));

            for (let i = 0; i < users.length; i++) {
              let totalUserDuration = 0;
              series.forEach(val => {
                if (users[i].name === val.userName) {
                  totalUserDuration += val.duration;
                }
              });
              users[i].data.push(totalUserDuration);
            }
          }
        }
        totalDuration.push(launch.duration);
      });
    }

    users.push({ name: 'Total', data: totalDuration });
    console.log("DATA POINTS : " + JSON.stringify(users));
    return users;
  };

  const renderChart = (launchesData, statsData) => {
    if (!launchesData || launchesData.length === 0) {
      return;
    }

    Highcharts.chart("exetrend", {
      title: {
        text: "Launches Time Duration Trend",
      },
      yAxis: {
        title: {
          text: "Total Time (H:M)",
        },
        type: 'datetime',
        dateTimeLabelFormats: {
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
        categories: launchesData.map(launch => Utils.timeToDateNoTime(launch.startTime)),
      },
      legend: {
        layout: "vertical",
        align: "right",
        verticalAlign: "middle",
      },
      tooltip: {
        formatter: function() {
          return `<div>${this.x} <br>
                  <span style='color:${this.point.color}'>\u25CF</span>
                  <b> ${this.series.name}: ${Utils.timePassed(this.y)}</b><br/>
                  </div>`;
        }
      },
      plotOptions: {
        series: {
          label: {
            connectorAllowed: false,
          },
        },
      },
      series: getSeries(launchesData, statsData),
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
  };

  const getLaunches = (statsData) => {
    if (!projectId) {
      return;
    }

    Backend.get(`${projectId}/launch?${Utils.filterToQuery(filter)}`)
      .then(response => {
        const reversedLaunches = [...response].reverse();
        setLaunches(reversedLaunches);
        setLoading(false);
        
        // Defer chart rendering to next tick to ensure DOM is ready
        setTimeout(() => {
          renderChart(reversedLaunches, statsData);
        }, 0);
      })
      .catch(error => {
        setErrorMessage(`getLaunches::Couldn't get launches, error: ${error}`);
        setLoading(false);
      });
  };

  const getStats = () => {
    if (!projectId) {
      return;
    }

    Backend.get(`${projectId}/launch/statistics?${Utils.filterToQuery(filter)}`)
      .then(response => {
        setStats(response);
        getLaunches(response);
      })
      .catch(error => {
        setErrorMessage(`getStats::Couldn't get launch statistics, error: ${error}`);
        setLoading(false);
      });
  };

  useEffect(() => {
    getStats();
  }, [projectId, JSON.stringify(filter)]);

  return (
    <div>
      <ControlledPopup popupMessage={errorMessage} />
      <div id="exetrend"></div>
      <div id="sweet-loading">
        <FadeLoader sizeUnit="px" size={100} color="#135f38" loading={loading} />
      </div>
    </div>
  );
};

export default LaunchesByUserExecutionTrend;
