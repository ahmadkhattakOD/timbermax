// third-party
import { FormattedMessage } from "react-intl";

// assets
import {
  BookSaved,
  Briefcase,
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
  deliveries: Truck,
  items: ForwardItem,
  stock: ClipboardTick,
  warehouses: House2,
  opportunityDescriptions: NoteSquare,
  contactus: I24Support,
  invoices: MoneyTick,
};

// ==============================|| MENU ITEMS - PAGES ||============================== //

const manageAdmin: NavItemType = {
  id: "manage-pages",
  type: "group",
  children: [
    {
      id: "manage",
      title: <FormattedMessage id="manage" />,
      type: "collapse",
      icon: icons.maintenance,
      children: [
  
        {
          id:"invoices",
          title:<FormattedMessage id="Invoice" />,
          type:"item",
          url:'/invoices',
          icon:icons.invoices,
          target:false
        },
        {
          id: "quotations",
          title: <FormattedMessage id="Quotations" />,
          type: "item",
          url: "/quotations",
          icon: icons.sales,
          target: false,
        },
        
      ],
    },
  ],
};

const manageSalesPerson: NavItemType = {
  id: "manage-pages",
  type: "group",
  children: [
    {
      id: "manage",
      title: <FormattedMessage id="manage" />,
      type: "collapse",
      icon: icons.maintenance,
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
    },
  ],
};

const manageCloser: NavItemType = {
  id: "manage-pages",
  title: <FormattedMessage id="manage" />,
  type: "group",
  children: [
    {
      id: "manage",
      title: <FormattedMessage id="manage" />,
      type: "collapse",
      icon: icons.maintenance,
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
    },
  ],
};

export default { manageAdmin, manageSalesPerson, manageCloser };
