import { lazy } from "react";

// project-imports
import Loadable from "components/Loadable";
import DashboardLayout from "layout/Dashboard";
import PagesLayout from "layout/Pages";
import SimpleLayout from "layout/Simple";
import { SimpleLayoutType } from "config";
import Dashboard from "pages/dashboard/dashboard";
import Sales from "pages/sales/main/sales";
import CreateSale from "pages/sales/create/create-sale";
import EditSale from "pages/sales/edit/edit-sale";
import Warehouses from "pages/warehouses/main/warehouses";
import CreateWarehouse from "pages/warehouses/create/create-warehouse";
import EditWarehouse from "pages/warehouses/edit/edit-warehouse";
import Items from "pages/items/main/items";
import CreateItem from "pages/items/create/create-item";
import EditItem from "pages/items/edit/edit-item";
import Shows from "pages/shows/main/shows";
import CreateShow from "pages/shows/create/create-show";
import EditShow from "pages/shows/edit/edit-show";
import Stock from "pages/stock/main/stock";
import CreateStock from "pages/stock/create/create-stock";
import EditStock from "pages/stock/edit/edit-stock";
import MoveStock from "pages/stock/move/move-stock";
import Users from "pages/users/main/users";
import CreateUser from "pages/users/create/create-user";
import EditUser from "pages/users/edit/edit-user";
import Invoices from "pages/invoices/main/invoices";
import ViewInvoices from "pages/invoices/view/view-invoices";

const MaintenanceError = Loadable(
  lazy(() => import("pages/maintenance/error/404"))
);
const MaintenanceError500 = Loadable(
  lazy(() => import("pages/maintenance/error/500"))
);
const MaintenanceUnderConstruction = Loadable(
  lazy(() => import("pages/maintenance/under-construction/under-construction"))
);
const MaintenanceComingSoon = Loadable(
  lazy(() => import("pages/maintenance/coming-soon/coming-soon"))
);

const AppContactUS = Loadable(lazy(() => import("pages/contact-us")));
// render - sample page
const SamplePage = Loadable(
  lazy(() => import("pages/extra-pages/sample-page"))
);

// ==============================|| MAIN ROUTES ||============================== //

const MainRoutes = {
  path: "/",
  children: [
    {
      path: "/",
      element: <DashboardLayout />,
      children: [
        {
          path: "dashboard",
          element: <Dashboard />,
        },
      ],
    },
    {
      path: "/",
      element: <DashboardLayout />,
      children: [
        {
          path: "sales",
          element: <Sales />,
        },
      ],
    },
    {
      path: "/",
      element: <DashboardLayout />,
      children: [
        {
          path: "sales/new",
          element: <CreateSale />,
        },
      ],
    },
    {
      path: "/",
      element: <DashboardLayout />,
      children: [
        {
          path: "sales/:id/edit",
          element: <EditSale />,
        },
      ],
    },
    {
      path: "/",
      element: <DashboardLayout />,
      children: [
        {
          path: "warehouses",
          element: <Warehouses />,
        },
      ],
    },
    {
      path: "/",
      element: <DashboardLayout />,
      children: [
        {
          path: "warehouses/new",
          element: <CreateWarehouse />,
        },
      ],
    },
    {
      path: "/",
      element: <DashboardLayout />,
      children: [
        {
          path: "warehouses/:id/edit",
          element: <EditWarehouse />,
        },
      ],
    },
    {
      path: "/",
      element: <DashboardLayout />,
      children: [
        {
          path: "items",
          element: <Items />,
        },
      ],
    },
    {
      path: "/",
      element: <DashboardLayout />,
      children: [
        {
          path: "items/new",
          element: <CreateItem />,
        },
      ],
    },
    {
      path: "/",
      element: <DashboardLayout />,
      children: [
        {
          path: "items/:id/edit",
          element: <EditItem />,
        },
      ],
    },
    {
      path: "/",
      element: <DashboardLayout />,
      children: [
        {
          path: "shows",
          element: <Shows />,
        },
      ],
    },
    {
      path: "/",
      element: <DashboardLayout />,
      children: [
        {
          path: "shows/new",
          element: <CreateShow />,
        },
      ],
    },
    {
      path: "/",
      element: <DashboardLayout />,
      children: [
        {
          path: "shows/:id/edit",
          element: <EditShow />,
        },
      ],
    },
    {
      path: "/",
      element: <DashboardLayout />,
      children: [
        {
          path: "stock",
          element: <Stock />,
        },
      ],
    },
    {
      path: "/",
      element: <DashboardLayout />,
      children: [
        {
          path: "stock/new",
          element: <CreateStock />,
        },
      ],
    },
    {
      path: "/",
      element: <DashboardLayout />,
      children: [
        {
          path: "stock/move",
          element: <MoveStock />,
        },
      ],
    },
    {
      path: "/",
      element: <DashboardLayout />,
      children: [
        {
          path: "stock/:id/edit",
          element: <EditStock />,
        },
      ],
    },
    {
      path: "/",
      element: <DashboardLayout />,
      children: [
        {
          path: "users",
          element: <Users />,
        },
      ],
    },
    {
      path: "/",
      element: <DashboardLayout />,
      children: [
        {
          path: "users/new",
          element: <CreateUser />,
        },
      ],
    },
    {
      path: "/",
      element: <DashboardLayout />,
      children: [
        {
          path: "users/:id/edit",
          element: <EditUser />,
        },
      ],
    },
    {
      path: "/",
      element: <DashboardLayout />,
      children: [
        {
          path: "invoices/users",
          element: <Invoices />,
        },
      ],
    },
    {
      path: "/",
      element: <DashboardLayout />,
      children: [
        {
          path: "invoices/users/:id/view",
          element: <ViewInvoices />,
        },
      ],
    },








    {
      path: "/",
      element: <DashboardLayout />,
      children: [
        {
          path: "sample-page",
          element: <SamplePage />,
        },
      ],
    },
    
    {
      path: "/",
      element: <SimpleLayout layout={SimpleLayoutType.SIMPLE} />,
      children: [
        {
          path: "contact-us",
          element: <AppContactUS />,
        },
      ],
    },
    {
      path: "/maintenance",
      element: <PagesLayout />,
      children: [
        {
          path: "404",
          element: <MaintenanceError />,
        },
        {
          path: "500",
          element: <MaintenanceError500 />,
        },
        {
          path: "under-construction",
          element: <MaintenanceUnderConstruction />,
        },
        {
          path: "coming-soon",
          element: <MaintenanceComingSoon />,
        },
      ],
    },
    { path: "*", element: <MaintenanceError /> },
  ],
};

export default MainRoutes;
