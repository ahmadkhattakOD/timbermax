// third-party
import { FormattedMessage } from "react-intl";

// assets
import { Clipboard, ClipboardTick, ForwardItem, House2 } from "iconsax-react";

// type
import { NavItemType } from "types/menu";

// icons
// icons
const icons = {
  inventory: Clipboard,
  items: ForwardItem,
  stock: ClipboardTick,
  warehouses: House2,
};

// ==============================|| MENU ITEMS - PAGES ||============================== //

const inventory: NavItemType = {
  id: "inventory-pages",
  type: "group",
  children: [
    {
      id: "inventory",
      title: <FormattedMessage id="inventory" />,
      type: "collapse",
      icon: icons.inventory,
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
    },
  ],
};

const inventoryWithoutItems: NavItemType = {
  id: "inventory-pages",
  type: "group",
  children: [
    {
      id: "inventory",
      title: <FormattedMessage id="inventory" />,
      type: "collapse",
      icon: icons.inventory,
      children: [
        {
          id: "stock",
          title: <FormattedMessage id="stock" />,
          type: "item",
          url: "/stock",
          icon: icons.stock,
          target: false,
        },
      ],
    },
  ],
};

export default inventory;
export { inventoryWithoutItems };
