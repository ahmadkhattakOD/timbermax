import { ApexOptions } from "apexcharts";
import { useEffect, useState } from "react";
import InvoicesRepository from "utils/repositories/invoicesRepository";
import ProfilesRepository from "utils/repositories/profilesRepository";
import SalesRepository from "utils/repositories/salesRepository";

export function useDashboard() {
  const [salesOptions, setSalesOptions] = useState<ApexOptions>({
    chart: {
      id: "sales",
    },
    xaxis: {
      categories: [],
    },
  });
  const [salesSeries, setSalesSeries] = useState<
    { name: string; data: number[] }[]
  >([
    {
      name: "",
      data: [],
    },
  ]);
  const [salesYear, setSalesYear] = useState(new Date().getFullYear());

  const [commissionOptions, setCommissionOptions] = useState<ApexOptions>({
    chart: {
      id: "commission",
    },
    xaxis: {
      categories: [],
    },
  });
  const [commissionSeries, setCommissionSeries] = useState<
    { name: string; data: number[] }[]
  >([
    {
      name: "",
      data: [],
    },
  ]);
  const [commissionYear, setCommissionYear] = useState(
    new Date().getFullYear()
  );

  const [userOptions, setUserOptions] = useState<ApexOptions>({
    chart: {
      type: "donut",
      id: "users",
    },
    labels: [],
  });
  const [userSeries, setUserSeries] = useState([]);

  async function getTotalSales() {
    const salesRepository = new SalesRepository();
    const totalSales = await salesRepository.getTotalSalesForYear(salesYear);

    if (totalSales) {
      let categories = [];
      let values = [];
      for (let i = 0; i < totalSales.length; i++) {
        categories.push(totalSales[i].month);
        values.push(totalSales[i].sales);
      }

      setSalesOptions({
        chart: {
          id: "basic-bar",
        },
        xaxis: {
          categories: categories,
        },
      });

      setSalesSeries([{ data: values, name: "sales" }]);
    }
  }

  async function getTotalCommission() {
    const invoicesRepository = new InvoicesRepository();
    const totalCommissions =
      await invoicesRepository.getTotalCommissionsForYear(commissionYear);

    if (totalCommissions) {
      console.log(totalCommissions);

      let categories = [];
      let values = [];
      for (let i = 0; i < totalCommissions.length; i++) {
        categories.push(totalCommissions[i].month);
        values.push(totalCommissions[i].sales);
      }

      setCommissionOptions({
        chart: {
          id: "commission",
        },
        xaxis: {
          categories: categories,
        },
      });

      setCommissionSeries([{ data: values, name: "commission" }]);
    }
  }

  // BUGS
  // commission calculation check DONE
  // Invoice generation PDF
  // Cancelled sales calculation DONE
  // Opportunity Descriptions
  // daily wages calculation
  // Show other bonuses on the next line
  // new password to next line

  async function getUsers() {
    const profilesRepository = new ProfilesRepository();
    const allProfiles = await profilesRepository.getWithoutFilters();
    if (allProfiles) {
      const { profilesData, profilesError } = allProfiles;
      if (profilesData && !profilesError) {
        let userLabels = [];
        let userValues = [];
        for (let i = 0; i < profilesData.length; i++) {
          userLabels.push(profilesData[i].role);

        }
      }
    }
  }

  useEffect(() => {
    getTotalSales();
    getTotalCommission();
  }, []);

  return {
    salesOptions,
    salesSeries,
    commissionOptions,
    commissionSeries,
    userOptions,
    userSeries,
  };
}
