/* eslint-disable react/no-direct-mutation-state */
import React, { useState, useEffect } from "react";
import * as Utils from "../common/Utils";
import ControlledPopup from "../common/ControlledPopup";
import Highcharts from "highcharts";
import Backend from "../services/backend";
import { FadeLoader } from "react-spinners";

const defaultFilter = {
  skip: 0,
  limit: 20,
  orderby: "id",
  orderdir: "DESC",
  includedFields: "launchStats,createdTime,testCaseTree",
};

function LaunchesByUserExecutionTrend({ projectId, filter: filterProp }) {
  const filter = filterProp || defaultFilter;
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (!projectId) return;

    Backend.get(projectId + "/launch/statistics?" + Utils.filterToQuery(filter))
      .then(statsResponse => {
        Backend.get(projectId + "/launch?" + Utils.filterToQuery(filter))
          .then(launchesResponse => {
            const launches = launchesResponse.reverse();
            setLoading(false);

            const statsAll = statsResponse.all;
            const users =
              statsAll && Object.keys(statsAll.users)
                ? Object.keys(statsAll.users).map(user => ({ name: user, data: [] }))
                : [];

            let totalDuration = [];
            if (launches && statsAll) {
              launches.forEach(launch => {
                if (launch.testCaseTree != null) {
                  let testCases = [];
                  if (launch.testCaseTree.testCases.length > 0) {
                    testCases = launch.testCaseTree.testCases;
                  } else if (launch.testCaseTree.children) {
                    launch.testCaseTree.children.forEach(child => {
                      testCases = testCases.concat(child.testCases);
                    });
                  }
                  const series = testCases.map(tc => ({
                    launchName: launch.name,
                    userName: tc.currentUser,
                    duration: tc.duration,
                    total: launch.duration,
                  }));
                  for (let i = 0; i < users.length; i++) {
                    let totalUserDuration = 0;
                    series.forEach(val => {
                      if (users[i].name === val.userName) totalUserDuration += val.duration;
                    });
                    users[i].data.push(totalUserDuration);
                  }
                }
              });
              totalDuration = launches.map(l => l.duration);
            }
            users.push({ name: "Total", data: totalDuration });
            const seriesData = Object.keys(users).map(key => users[key]);

            Highcharts.chart("exetrend", {
              title: { text: "Launches Time Duration Trend" },
              yAxis: {
                title: { text: "Total Time (H:M)" },
                type: "datetime",
                dateTimeLabelFormats: {
                  second: "%H:%M",
                  minute: "%H:%M",
                  hour: "%H:%M",
                  day: "%H:%M",
                  week: "%H:%M",
                  month: "%H:%M",
                  year: "%H:%M",
                },
              },
              xAxis: {
                title: { text: "Launch Start time" },
                categories: launches.map(l => Utils.timeToDateNoTime(l.startTime)),
              },
              legend: { layout: "vertical", align: "right", verticalAlign: "middle" },
              tooltip: {
                formatter: function () {
                  return `<div>${this.x} <br><span style='color:${this.point.color}'>●</span><b> ${
                    this.series.name
                  }: ${Utils.timePassed(this.y)}</b><br/></div>`;
                },
              },
              plotOptions: { series: { label: { connectorAllowed: false } } },
              series: seriesData,
              responsive: {
                rules: [
                  {
                    condition: { maxWidth: 500 },
                    chartOptions: { legend: { layout: "horizontal", align: "center", verticalAlign: "bottom" } },
                  },
                ],
              },
            });
          })
          .catch(error => {
            setErrorMessage("Couldn't get launches: " + error);
            setLoading(false);
          });
      })
      .catch(error => {
        setErrorMessage("Couldn't get launch statistics: " + error);
        setLoading(false);
      });
  }, [projectId, filter]);

  return (
    <div>
      <ControlledPopup popupMessage={errorMessage} />
      <div id="exetrend"></div>
      <div id="sweet-loading">
        <FadeLoader size={100} color={"#135f38"} loading={loading} />
      </div>
    </div>
  );
}

export default LaunchesByUserExecutionTrend;
