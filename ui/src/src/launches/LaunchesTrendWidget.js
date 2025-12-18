import React, { useState, useEffect } from "react";
import * as Utils from "../common/Utils";
import { FadeLoader } from "react-spinners";
import Highcharts from "highcharts";
import HighchartsReact from "highcharts-react-official";
import Backend from "../services/backend";
import ControlledPopup from "../common/ControlledPopup";

const LaunchesTrendWidget = (props) => {
  const [launches, setLaunches] = useState([]);
  const [filter, setFilter] = useState({
    skip: 0,
    limit: 20,
    orderby: "id",
    orderdir: "DESC",
    includedFields: "launchStats,createdTime",
  });
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [projectId, setProjectId] = useState(props.projectId);

  // Get series data for chart
  const getSeries = () => {
    const totalStats = {
      PASSED: { name: "Passed", color: "#28a745", data: [] },
      FAILED: { name: "Failed", color: "#dc3545", data: [] },
      BROKEN: { name: "Broken", color: "#ffc107", data: [] },
      TOTAL: { name: "Total", color: "#007bff", data: [] },
    };

    if (typeof launches !== 'undefined') {
      launches.forEach(launch => {
        Object.keys(launch.launchStats.statusCounters).forEach(key => {
          if (totalStats[key]) {
            totalStats[key].data.push(launch.launchStats.statusCounters[key]);
          }
        });
        totalStats["TOTAL"].data.push(launch.launchStats.total);
      });
    }

    return Object.keys(totalStats).map(key => totalStats[key]);
  };

  // Render chart
  const renderChart = (launchData) => {
    if (typeof launchData !== 'undefined' && launchData.length > 0) {
      Highcharts.chart("trend", {
        title: {
          text: "Launches Statuses Trend",
        },

        yAxis: {
          title: {
            text: "TestCases",
          },
        },

        xAxis: {
          categories: launchData.map(launch => Utils.timeToDateNoTime(launch.createdTime)),
        },

        legend: {
          layout: "vertical",
          align: "right",
          verticalAlign: "middle",
        },

        plotOptions: {
          series: {
            label: {
              connectorAllowed: false,
            },
          },
        },
        series: getSeries(),
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
  };

  // Get launches
  const getLaunches = (currentProjectId, currentFilter) => {
    if (!currentProjectId) {
      return;
    }
    Backend.get(currentProjectId + "/launch?" + Utils.filterToQuery(currentFilter))
      .then(response => {
        const reversedLaunches = response.reverse();
        setLaunches(reversedLaunches);
        setLoading(false);
        renderChart(reversedLaunches);
      })
      .catch(error => {
        setErrorMessage("getLaunches::Couldn't get launches, error: " + error);
        setLoading(false);
      });
  };

  // Update from props
  useEffect(() => {
    if (props.projectId) {
      setProjectId(props.projectId);
    }
    if (props.filter) {
      setFilter(props.filter);
    }
  }, [props.projectId, props.filter]);

  // Initial mount and when projectId/filter changes
  useEffect(() => {
    getLaunches(projectId, filter);
  }, [projectId, filter]);

  // Re-render chart when launches change
  useEffect(() => {
    if (launches.length > 0) {
      renderChart(launches);
    }
  }, [launches]);

  return (
    <div>
      <ControlledPopup popupMessage={errorMessage} />
      <div id="trend"></div>
      <div id="sweet-loading">
        <FadeLoader sizeUnit={"px"} size={100} color={"#135f38"} loading={loading} />
      </div>
    </div>
  );
};

export default LaunchesTrendWidget;
