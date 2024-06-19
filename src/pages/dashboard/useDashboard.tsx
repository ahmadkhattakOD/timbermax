import { ApexOptions } from "apexcharts";
import { useState } from "react";

const dummySeriesDay = [
  {
    name: "series-1",
    data: [30, 40, 45, 50, 49, 60, 70, 91],
  },
];

const dummyUserSeries = [44, 55, 41, 17, 15];

export function useDashboard() {
  const [options, setOptions] = useState<ApexOptions>({
    chart: {
      id: "basic-bar",
    },
    xaxis: {
      categories: [1991, 1992, 1993, 1994, 1995, 1996, 1997, 1998, 1999],
    },
  });
  const [series, setSeries] = useState(dummySeriesDay);

  const [userSeries, setUserSeries] = useState(dummyUserSeries);
  const [userOptions, setUserOptions] = useState<ApexOptions>({
    chart: {
      type: "donut",
      id: "users"
    },
    labels: ['A', 'B', 'C', 'D', 'E']
  })

  return {
    options,
    series,
    userOptions,
    userSeries
  };
}
