import React, { useEffect, useMemo } from "react";
import Highcharts from "highcharts";
import HighchartsReact from "highcharts-react-official";
import * as Utils from "../common/Utils";

const LaunchAttributeStatsChart = ({ stats, attrKey }) => {
  const seriesConfig = useMemo(() => Utils.getChartSeriesConfig(), []);

  const getChartContainerId = () => {
    return `launch-attr-stats-${attrKey}`;
  };

  const setUpStatusSeries = () => {
    return Object.keys(seriesConfig).map(statusKey => ({
      name: statusKey,
      color: seriesConfig[statusKey].color,
      data: Object.keys(stats.values).map(attrValue => ({
        name: seriesConfig[statusKey].name,
        y: stats.values[attrValue][statusKey],
      })),
    }));
  };

  const statusChartRender = () => {
    if (!stats?.values) {
      return;
    }

    const statusSeries = setUpStatusSeries();

    Highcharts.chart({
      chart: {
        type: "column",
        renderTo: getChartContainerId(),
      },
      title: {
        text: stats.name,
      },
      xAxis: {
        categories: Object.keys(stats.values),
      },
      yAxis: {
        title: {
          text: "Testcases",
        },
      },
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
  };

  useEffect(() => {
    // Defer chart rendering to next tick to ensure DOM is ready
    setTimeout(() => {
      statusChartRender();
    }, 0);
  }, [stats, attrKey]);

  return (
    <div id={getChartContainerId()} className="launch-attr-stats-chart">
    </div>
  );
};

export default LaunchAttributeStatsChart;
