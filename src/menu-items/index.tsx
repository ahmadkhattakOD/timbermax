// types
import { NavItemType } from "types/menu";

import users from "./users";
import manage from "./manage";
import dashboard from "./dashboard";
import edit from "./edit";
import inventory, { inventoryWithoutItems } from "./inventory";
import crm from "./crm";

// ==============================|| MENU ITEMS ||============================== //

const menuItemsSuperAdmin: { items: NavItemType[] } = {
  items: [dashboard, crm, manage.manageAdmin, inventory, users, edit],
};

const menuItemsAdmin: { items: NavItemType[] } = {
  items: [crm, manage.manageAdmin, inventoryWithoutItems, edit],
};

const menuItemsWarehouseOperator: { items: NavItemType[] } = {
  items: [inventoryWithoutItems, edit],
};

export default {
  menuItemsAdmin,
  menuItemsSuperAdmin,
  menuItemsWarehouseOperator,
};
