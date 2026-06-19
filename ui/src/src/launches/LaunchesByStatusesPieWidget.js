import React, { useState, useEffect } from "react";
import * as Utils from "../common/Utils";
import { FadeLoader } from "react-spinners";
import Highcharts from "highcharts";
import Backend from "../services/backend";
import ControlledPopup from "../common/ControlledPopup";

const defaultFilter = { skip: 0, limit: 20, orderby: "id", orderdir: "ASC", includedFields: "launchStats,createdTime" };

function LaunchesByStatusesPieWidget({ projectId, filter: filterProp }) {
  const filter = filterProp || defaultFilter;
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (!projectId) return;
    Backend.get(projectId + "/launch/statistics?" + Utils.filterToQuery(filter))
      .then(response => {
        setLoading(false);
        if (typeof response.all !== "undefined") {
          const s = response.all.launchStats.statusCounters;
          Highcharts.chart({
            chart: { type: "pie", renderTo: "pie-by-statuses" },
            title: { verticalAlign: "middle", floating: true, text: "Statuses", style: { fontSize: "10px" } },
            plotOptions: {
              pie: { dataLabels: { format: "{point.name}: {point.percentage:.1f} %" }, innerSize: "70%" },
            },
            series: [
              {
                name: "Statuses",
                data: [
                  { name: "Passed", y: s.PASSED, color: "#28a745" },
                  { name: "Failed", y: s.FAILED, color: "#dc3545" },
                  { name: "Broken", y: s.BROKEN, color: "#ffc107" },
                  { name: "Runnable", y: s.RUNNABLE, color: "#7cb5ec" },
                  { name: "Running", y: s.RUNNING, color: "#007bff" },
                ],
              },
            ],
          });
        }
      })
      .catch(error => {
        setErrorMessage("Couldn't get launch statistics: " + error);
        setLoading(false);
      });
  }, [projectId, filter]);

  return (
    <div>
      <ControlledPopup popupMessage={errorMessage} />
      <div id="pie-by-statuses"></div>
      <div id="sweet-loading">
        <FadeLoader size={100} color={"#135f38"} loading={loading} />
      </div>
    </div>
  );
}

export default LaunchesByStatusesPieWidget;
