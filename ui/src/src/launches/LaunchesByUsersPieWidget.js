import React, { useState, useEffect, useRef } from "react";
import * as Utils from "../common/Utils";
import { FadeLoader } from "react-spinners";
import Highcharts from "highcharts";
import HighchartsReact from "highcharts-react-official";
import Backend from "../services/backend";
import ControlledPopup from "../common/ControlledPopup";

const LaunchesByUsersPieWidget = ({ projectId, filter: propFilter }) => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const chartRenderedRef = useRef(false);

  const defaultFilter = {
    skip: 0,
    limit: 20,
    orderby: "id",
    orderdir: "ASC",
    includedFields: "launchStats,createdTime",
  };

  const filter = { ...defaultFilter, ...propFilter };

  const setUpUsersPieSeries = (statsData) => {
    if (!statsData?.all?.users) {
      return [];
    }

    return [
      {
        name: "Statuses",
        data: Object.keys(statsData.all.users).map(user => ({
          name: user,
          y: statsData.all.users[user]
        })),
      },
    ];
  };

  const usersPieChartRender = (userSeries) => {
    if (!userSeries || userSeries.length === 0 || !userSeries[0].data.length) {
      return;
    }

    Highcharts.chart({
      chart: {
        type: "pie",
        renderTo: "pie-by-users",
      },
      title: {
        verticalAlign: "middle",
        floating: true,
        text: "Users",
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
      series: userSeries,
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
        const userSeries = setUpUsersPieSeries(response);
        setLoading(false);
        
        // Defer chart rendering to next tick to ensure DOM is ready
        setTimeout(() => {
          usersPieChartRender(userSeries);
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
      <div id="pie-by-users"></div>
      <div id="sweet-loading">
        <FadeLoader sizeUnit="px" size={100} color="#135f38" loading={loading} />
      </div>
    </div>
  );
};

export default LaunchesByUsersPieWidget;
