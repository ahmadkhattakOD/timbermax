// third-party
import { FormattedMessage } from "react-intl";

// assets
import { Briefcase, ClipboardTick, ForwardItem, House2, I24Support, MessageProgramming, Money, UserEdit } from "iconsax-react";

// type
import { NavItemType } from "types/menu";

// icons
// icons
const icons = {
  maintenance: MessageProgramming,
  sales: Money,
  items: ForwardItem,
  stock: ClipboardTick,
  shows: Briefcase,
  warehouses: House2,
  users: UserEdit,
  contactus: I24Support,
};

// ==============================|| MENU ITEMS - PAGES ||============================== //

const manage: NavItemType = {
  id: "group-pages",
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
      id: "users",
      title: <FormattedMessage id="users" />,
      type: "item",
      url: "/users",
      icon: icons.users,
      target: false,
    },
  ],
};

export default manage;
