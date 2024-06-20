import { ApexOptions } from "apexcharts";
import useAuth from "hooks/useAuth";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { UserRoles } from "utils/helpers";
import InvoicesRepository from "utils/repositories/invoicesRepository";
import ProfilesRepository from "utils/repositories/profilesRepository";
import SalesRepository from "utils/repositories/salesRepository";
import ShowsRepository from "utils/repositories/showsRepository";
import StocksRepository from "utils/repositories/stocksRepository";

export function useDashboard() {
  const navigate = useNavigate();
  const [loadingSales, setLoadingSales] = useState(true);
  const [salesOptions, setSalesOptions] = useState<ApexOptions>({
    chart: {
      id: "Sales",
      toolbar: {
        show: false,
      },
    },
    xaxis: {
      categories: [],
    },
    dataLabels: {
      enabled: false,
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
  const [yearOptions, setYearOptions] = useState<number[]>([
    new Date().getFullYear(),
  ]);

  const [loadingCommissions, setLoadingCommissions] = useState(true);
  const [commissionOptions, setCommissionOptions] = useState<ApexOptions>({
    chart: {
      id: "Commission",
      toolbar: {
        show: false,
      },
    },
    xaxis: {
      categories: [],
    },
    dataLabels: {
      enabled: false,
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

  const [loadingUsers, setLoadingUsers] = useState(true);
  const [userOptions, setUserOptions] = useState<ApexOptions>({
    chart: {
      type: "donut",
      id: "users",
    },
    labels: [],
    dataLabels: {
      enabled: false,
    },
  });
  const [userSeries, setUserSeries] = useState<number[]>([]);

  const [loadingUpcomingShows, setLoadingUpcomingShows] = useState(true);
  const [upcomingShows, setUpcomingShows] = useState<any[]>([]);

  const [loadingLowInStock, setLoadingLowInStock] = useState(true);
  const [lowInStock, setLowInStock] = useState<any[]>([]);

  const { role } = useAuth();

  function viewAllShows() {
    navigate("/shows");
  }

  function viewShow(id: number) {
    navigate(`/shows/${id}/edit`);
  }

  function viewAllUsers() {
    navigate("/users");
  }

  function viewAllStock() {
    navigate("/users");
  }

  function viewStock(id: number) {
    navigate(`/stock/${id}/edit`);
  }

  async function getTotalSales() {
    setLoadingSales(true);
    const profilesRepository = new ProfilesRepository();
    const currentUser = await profilesRepository.getCurrentUser();
    if (currentUser) {
      const salesRepository = new SalesRepository();
      const totalSales = await salesRepository.getTotalSalesForYear(
        salesYear,
        role !== UserRoles.Admin ? currentUser.id : undefined
      );

      if (totalSales) {
        let categories = [];
        let values = [];
        for (let i = 0; i < totalSales.length; i++) {
          categories.push(totalSales[i].month);
          values.push(totalSales[i].sales);
        }

        setSalesOptions({
          chart: {
            id: "Sales",
            toolbar: {
              show: false,
            },
          },
          xaxis: {
            categories: categories,
          },
          dataLabels: {
            enabled: false,
          },
        });

        setSalesSeries([{ data: values, name: "Sales" }]);
      }
    }
    setLoadingSales(false);
  }

  function generateYearOptions() {
    let todayYear = new Date().getFullYear();
    let startingYear = 2024;

    let years = [];

    for (let i = todayYear; i >= startingYear; i--) {
      years.push(i);
    }

    setYearOptions(years);
  }

  function handleSalesYearChange(newYear: number) {
    setSalesYear(newYear);
  }

  function handleCommissionYearChange(newYear: number) {
    setCommissionYear(newYear);
  }

  async function getTotalCommission() {
    setLoadingCommissions(true);
    const profilesRepository = new ProfilesRepository();
    const currentUser = await profilesRepository.getCurrentUser();
    if (currentUser) {
      const invoicesRepository = new InvoicesRepository();
      const totalCommissions =
        await invoicesRepository.getTotalCommissionsForYear(
          commissionYear,
          role !== UserRoles.Admin ? currentUser.id : undefined
        );

      if (totalCommissions) {
        let categories = [];
        let values = [];
        for (let i = 0; i < totalCommissions.length; i++) {
          categories.push(totalCommissions[i].month);
          values.push(totalCommissions[i].sales);
        }

        setCommissionOptions({
          chart: {
            id: "Commission",
            toolbar: {
              show: false,
            },
          },
          xaxis: {
            categories: categories,
          },
          dataLabels: {
            enabled: false,
          },
        });

        setCommissionSeries([{ data: values, name: "Commission" }]);
      }
    }

    setLoadingCommissions(false);
  }

  // BUGS
  // commission calculation check DONE
  // Invoice generation PDF
  // Cancelled sales calculation DONE
  // Opportunity Descriptions DONE ALMOST (HANDLE THE NEW INPUT FIELD)
  // daily wages calculation DONE
  // Show other bonuses on the next line DONE
  // new password to next line DONE

  async function getUsers() {
    try {
      setLoadingUsers(true);
      const profilesRepository = new ProfilesRepository();
      const allProfiles = await profilesRepository.getWithoutFilters();
      if (allProfiles) {
        const { profilesData, profilesError } = allProfiles;
        if (profilesData && !profilesError) {
          let usersCount = {
            "Sales Person": 0,
            Closer: 0,
            "Sales Person & Closer": 0,
          };
          for (let i = 0; i < profilesData.length; i++) {
            usersCount[
              profilesData[i].role as
                | UserRoles.SalesPerson
                | UserRoles.Closer
                | UserRoles.Both
            ] += 1;
          }
          setUserOptions({
            chart: {
              type: "donut",
              id: "Users",
            },
            labels: [UserRoles.SalesPerson, UserRoles.Closer, UserRoles.Both],
            dataLabels: {
              enabled: false,
            },
          });
          setUserSeries([
            usersCount["Sales Person"],
            usersCount.Closer,
            usersCount["Sales Person & Closer"],
          ]);
        }
      }
      setLoadingUsers(false);
    } catch (error) {
      console.error("Error fetching users:", error);
    }
  }

  async function getUpcomingShows() {
    try {
      setLoadingUpcomingShows(true);
      const showsRepository = new ShowsRepository();
      const allShows = await showsRepository.getUpcoming();
      if (allShows) {
        const { showsData, showsError } = allShows;
        if (showsData && !showsError) {
          setUpcomingShows(showsData);
        }
      }
      setLoadingUpcomingShows(false);
    } catch (error) {
      console.error("Error fetching shows:", error);
    }
  }

  async function getLowInStock() {
    try {
      setLoadingLowInStock(true);
      const stocksRepository = new StocksRepository();
      const allStocks = await stocksRepository.getLowInStock();
      if (allStocks) {
        const { stocksData, stocksError } = allStocks;
        if (stocksData && !stocksError) {
          setLowInStock(stocksData);
        }
      }
      setLoadingLowInStock(false);
    } catch (error) {
      console.error("Error fetching shows:", error);
    }
  }

  useEffect(() => {
    if (role === UserRoles.Admin) {
      getUsers();
      getUpcomingShows();
      generateYearOptions();
      getLowInStock();
    }
  }, []);

  useEffect(() => {
    getTotalCommission();
  }, [salesYear]);

  useEffect(() => {
    getTotalSales();
  }, [commissionYear]);

  return {
    loadingSales,
    salesOptions,
    salesSeries,
    salesYear,
    loadingCommissions,
    commissionOptions,
    commissionSeries,
    commissionYear,
    userOptions,
    userSeries,
    upcomingShows,
    viewAllShows,
    viewAllUsers,
    viewAllStock,
    viewShow,
    viewStock,
    yearOptions,
    handleSalesYearChange,
    handleCommissionYearChange,
    lowInStock,
    loadingUsers,
    loadingUpcomingShows,
    loadingLowInStock,
    role
  };
}
