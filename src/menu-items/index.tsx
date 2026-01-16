// types
import { NavItemType } from "types/menu";

import users from "./users";
import manage from "./manage";
import dashboard from "./dashboard";
import edit from "./edit";
import inventory from "./inventory";
import crm from "./crm";

// ==============================|| MENU ITEMS ||============================== //

const menuItemsSuperAdmin: { items: NavItemType[] } = {
  items: [dashboard, crm, manage.manageAdmin, inventory, users, edit],
};

const menuItemsAdmin: { items: NavItemType[] } = {
  items: [dashboard, crm, manage.manageAdmin, inventory, edit],
};

const menuItemsWarehouseOperator: { items: NavItemType[] } = {
  items: [inventory, edit],
};

export default {
  menuItemsAdmin,
  menuItemsSuperAdmin,
  menuItemsWarehouseOperator,
};
