import React, { useState, useEffect } from "react";
import * as Utils from "../common/Utils";
import { FadeLoader } from "react-spinners";
import Highcharts from "highcharts";
import Backend from "../services/backend";
import ControlledPopup from "../common/ControlledPopup";

const defaultFilter = {
  skip: 0,
  limit: 20,
  orderby: "id",
  orderdir: "DESC",
  includedFields: "launchStats,createdTime",
};

function LaunchesTrendWidget({ projectId, filter: filterProp }) {
  const filter = filterProp || defaultFilter;
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (!projectId) return;
    Backend.get(projectId + "/launch?" + Utils.filterToQuery(filter))
      .then(response => {
        const launches = response.reverse();
        setLoading(false);
        const totalStats = {
          PASSED: { name: "Passed", color: "#28a745", data: [] },
          FAILED: { name: "Failed", color: "#dc3545", data: [] },
          BROKEN: { name: "Broken", color: "#ffc107", data: [] },
          TOTAL: { name: "Total", color: "#007bff", data: [] },
        };
        launches.forEach(launch => {
          Object.keys(launch.launchStats.statusCounters).forEach(key => {
            if (totalStats[key]) totalStats[key].data.push(launch.launchStats.statusCounters[key]);
          });
          totalStats.TOTAL.data.push(launch.launchStats.total);
        });
        Highcharts.chart("trend", {
          title: { text: "Launches Statuses Trend" },
          yAxis: { title: { text: "TestCases" } },
          xAxis: { categories: launches.map(l => Utils.timeToDateNoTime(l.createdTime)) },
          legend: { layout: "vertical", align: "right", verticalAlign: "middle" },
          plotOptions: { series: { label: { connectorAllowed: false } } },
          series: Object.keys(totalStats).map(key => totalStats[key]),
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
  }, [projectId, filter]);

  return (
    <div>
      <ControlledPopup popupMessage={errorMessage} />
      <div id="trend"></div>
      <div id="sweet-loading">
        <FadeLoader size={100} color={"#135f38"} loading={loading} />
      </div>
    </div>
  );
}

export default LaunchesTrendWidget;
