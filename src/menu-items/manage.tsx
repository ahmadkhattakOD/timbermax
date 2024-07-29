// third-party
import { FormattedMessage } from "react-intl";

// assets
import {
  BookSaved,
  Briefcase,
  BrifecaseTick,
  ClipboardTick,
  ForwardItem,
  House2,
  I24Support,
  MessageProgramming,
  Money,
  MoneyTick,
  NoteSquare,
  Truck,
} from "iconsax-react";

// type
import { NavItemType } from "types/menu";

// icons
// icons
const icons = {
  maintenance: MessageProgramming,
  sales: Money,
  customers: BookSaved,
  deliveries: Truck,
  items: ForwardItem,
  stock: ClipboardTick,
  shows: Briefcase,
  warehouses: House2,
  opportunityDescriptions: NoteSquare,
  contactus: I24Support,
  invoices: MoneyTick,
};

// ==============================|| MENU ITEMS - PAGES ||============================== //

const manageAdmin: NavItemType = {
  id: "manage-pages",
  title: <FormattedMessage id="manage" />,
  type: "group",
  children: [
    {
      id: "sales",
      title: <FormattedMessage id="sales" />,
      type: "item",
      url: "/sales",
      icon: icons.sales,
      target: false,
    },
    {
      id: "customers",
      title: <FormattedMessage id="customers" />,
      type: "item",
      url: "/customers",
      icon: icons.customers,
      target: false,
    },
    {
      id: "deliveries",
      title: <FormattedMessage id="deliveries" />,
      type: "item",
      url: "/deliveries",
      icon: icons.deliveries,
      target: false,
    },
    {
      id: "shows",
      title: <FormattedMessage id="shows" />,
      type: "item",
      url: "/shows",
      icon: icons.shows,
      target: false,
    },
    {
      id: "opportunity-descriptions",
      title: <FormattedMessage id="opportunity-descriptions" />,
      type: "item",
      url: "/opportunity-descriptions",
      icon: icons.opportunityDescriptions,
      target: false,
    },
  ],
};

const manageSalesPerson: NavItemType = {
  id: "manage-pages",
  title: <FormattedMessage id="manage" />,
  type: "group",
  children: [
    {
      id: "sales",
      title: <FormattedMessage id="sales" />,
      type: "item",
      url: "/view-sales",
      icon: icons.sales,
      target: false,
    },
    {
      id: "invoices",
      title: <FormattedMessage id="invoices" />,
      type: "item",
      url: "/view-invoices",
      icon: icons.invoices,
      target: false,
    },
  ],
};

const manageCloser: NavItemType = {
  id: "manage-pages",
  title: <FormattedMessage id="manage" />,
  type: "group",
  children: [
    {
      id: "sales",
      title: <FormattedMessage id="sales" />,
      type: "item",
      url: "/close-sales",
      icon: icons.sales,
      target: false,
    },
    {
      id: "invoices",
      title: <FormattedMessage id="invoices" />,
      type: "item",
      url: "/view-invoices",
      icon: icons.invoices,
      target: false,
    },
  ],
};

export default { manageAdmin, manageSalesPerson, manageCloser };
