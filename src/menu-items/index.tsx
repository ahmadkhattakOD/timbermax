// types
import { NavItemType } from 'types/menu';

import users from './users';
import manage from './manage';
import dashboard from './dashboard';
import edit from './edit';
import inventory from './inventory';

// ==============================|| MENU ITEMS ||============================== //

const menuItemsAdmin: { items: NavItemType[] } = {
  items: [dashboard, manage.manageAdmin, inventory, users, edit]
};

const menuItemsSalesPerson: { items: NavItemType[] } = {
  items: [dashboard, manage.manageSalesPerson, edit]
};

const menuItemsCloser: { items: NavItemType[] } = {
  items: [dashboard, manage.manageCloser, edit]
};

export default { menuItemsAdmin, menuItemsSalesPerson, menuItemsCloser };
