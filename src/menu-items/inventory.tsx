// third-party
import { FormattedMessage } from "react-intl";

// assets
import { ClipboardTick, ForwardItem, House2 } from "iconsax-react";

// type
import { NavItemType } from "types/menu";

// icons
// icons
const icons = {
  items: ForwardItem,
  stock: ClipboardTick,
  warehouses: House2,
};

// ==============================|| MENU ITEMS - PAGES ||============================== //

const inventory: NavItemType = {
  id: "inventory-pages",
  title: <FormattedMessage id="inventory" />,
  type: "group",
  children: [
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
  ],
};

export default inventory;
