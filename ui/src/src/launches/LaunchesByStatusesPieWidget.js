import React, { useState, useEffect } from "react";
import * as Utils from "../common/Utils";
import { FadeLoader } from "react-spinners";
import Highcharts from "highcharts";
import HighchartsReact from "highcharts-react-official";
import Backend from "../services/backend";
import ControlledPopup from "../common/ControlledPopup";

const LaunchesByStatusesPieWidget = ({ projectId, filter: propFilter }) => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  const defaultFilter = {
    skip: 0,
    limit: 20,
    orderby: "id",
    orderdir: "ASC",
    includedFields: "launchStats,createdTime",
  };

  const filter = { ...defaultFilter, ...propFilter };

  const setUpStatusPieSeries = (statsData) => {
    if (!statsData?.all?.launchStats?.statusCounters) {
      return [];
    }

    const { statusCounters } = statsData.all.launchStats;

    return [
      {
        name: "Statuses",
        data: [
          {
            name: "Passed",
            y: statusCounters.PASSED || 0,
            color: "#28a745",
          },
          {
            name: "Failed",
            y: statusCounters.FAILED || 0,
            color: "#dc3545",
          },
          {
            name: "Broken",
            y: statusCounters.BROKEN || 0,
            color: "#ffc107",
          },
          {
            name: "Runnable",
            y: statusCounters.RUNNABLE || 0,
            color: "#7cb5ec",
          },
          {
            name: "Running",
            y: statusCounters.RUNNING || 0,
            color: "#007bff",
          },
        ],
      },
    ];
  };

  const statusPieChartRender = (statusSeries) => {
    if (!statusSeries || statusSeries.length === 0 || !statusSeries[0].data.length) {
      return;
    }

    Highcharts.chart({
      chart: {
        type: "pie",
        renderTo: "pie-by-statuses",
      },
      title: {
        verticalAlign: "middle",
        floating: true,
        text: "Statuses",
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
      series: statusSeries,
    });
  };

  const getStats = () => {
    if (!projectId) {
      return;
    }

    setLoading(true);
    Backend.get(`${projectId}/launch/statistics?${Utils.filterToQuery(filter)}`)
      .then(response => {
        setStats(response);
        const statusSeries = setUpStatusPieSeries(response);
        setLoading(false);
        
        // Defer chart rendering to next tick to ensure DOM is ready
        setTimeout(() => {
          statusPieChartRender(statusSeries);
        }, 0);
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
      <div id="pie-by-statuses"></div>
      <div id="sweet-loading">
        <FadeLoader sizeUnit="px" size={100} color="#135f38" loading={loading} />
      </div>
    </div>
  );
};

export default LaunchesByStatusesPieWidget;
