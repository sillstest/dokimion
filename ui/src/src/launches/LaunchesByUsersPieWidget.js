import React, { useState, useEffect } from "react";
import * as Utils from "../common/Utils";
import { FadeLoader } from "react-spinners";
import Highcharts from "highcharts";
import Backend from "../services/backend";
import ControlledPopup from "../common/ControlledPopup";

const defaultFilter = { skip: 0, limit: 20, orderby: "id", orderdir: "ASC", includedFields: "launchStats,createdTime" };

function LaunchesByUsersPieWidget({ projectId, filter: filterProp }) {
  const filter = filterProp || defaultFilter;
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (!projectId) return;
    Backend.get(projectId + "/launch/statistics?" + Utils.filterToQuery(filter))
      .then(response => {
        setLoading(false);
        if (typeof response.all !== "undefined") {
          const userSeries = [
            {
              name: "Statuses",
              data: Object.keys(response.all.users).map(user => ({ name: user, y: response.all.users[user] })),
            },
          ];
          Highcharts.chart({
            chart: { type: "pie", renderTo: "pie-by-users" },
            title: { verticalAlign: "middle", floating: true, text: "Users", style: { fontSize: "10px" } },
            plotOptions: {
              pie: { dataLabels: { format: "{point.name}: {point.percentage:.1f} %" }, innerSize: "70%" },
            },
            series: userSeries,
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
      <div id="pie-by-users"></div>
      <div id="sweet-loading">
        <FadeLoader size={100} color={"#135f38"} loading={loading} />
      </div>
    </div>
  );
}

export default LaunchesByUsersPieWidget;
