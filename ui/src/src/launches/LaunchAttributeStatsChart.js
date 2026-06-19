import React, { useEffect } from "react";
import { withRouter } from "../common/withRouter";
import Highcharts from "highcharts";
import * as Utils from "../common/Utils";

function LaunchAttributeStatsChart({ stats, attrKey }) {
  const chartContainerId = "launch-attr-stats-" + attrKey;
  const seriesConfig = Utils.getChartSeriesConfig();

  useEffect(() => {
    if (!stats) return;
    const statusSeries = Object.keys(seriesConfig).map(statusKey => ({
      name: statusKey,
      color: seriesConfig[statusKey].color,
      data: Object.keys(stats.values).map(attrValue => ({
        name: seriesConfig[statusKey].name,
        y: stats.values[attrValue][statusKey],
      })),
    }));

    Highcharts.chart({
      chart: { type: "column", renderTo: chartContainerId },
      title: { text: stats.name },
      xAxis: { categories: Object.keys(stats.values) },
      yAxis: { title: { text: "Testcases" } },
      plotOptions: {
        column: {
          stacking: "normal",
          dataLabels: {
            enabled: true,
            formatter: function () {
              if (this.y > 0) return this.y;
            },
          },
        },
      },
      series: statusSeries,
    });
    // Redraw is keyed on the data (stats/attrKey); chartContainerId/seriesConfig are stable config.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stats, attrKey]);

  return (
    <div id={chartContainerId} className="launch-attr-stats-chart">
      Chart here
    </div>
  );
}

export default withRouter(LaunchAttributeStatsChart);
