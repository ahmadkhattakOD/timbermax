// third-party
import { FormattedMessage } from "react-intl";

// assets
import {
  Briefcase,
  ClipboardTick,
  ForwardItem,
  House2,
  I24Support,
  MessageProgramming,
  Money,
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
  shows: Briefcase,
  warehouses: House2,
  opportunityDescriptions: NoteSquare,
  contactus: I24Support,
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
      id: "items",
      title: <FormattedMessage id="items" />,
      type: "item",
      url: "/items",
      icon: icons.items,
      target: false,
    },
    {
      id: "stock",
      title: <FormattedMessage id="stock" />,
      type: "item",
      url: "/stock",
      icon: icons.stock,
      target: false,
    },
    {
      id: "warehouses",
      title: <FormattedMessage id="warehouses" />,
      type: "item",
      url: "/warehouses",
      icon: icons.warehouses,
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
  ],
};

export default { manageAdmin, manageCloser };
