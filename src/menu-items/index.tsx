// types
import { NavItemType } from 'types/menu';

import users from './users';
import manage from './manage';
import dashboard from './dashboard';

// ==============================|| MENU ITEMS ||============================== //

const menuItemsAdmin: { items: NavItemType[] } = {
  items: [dashboard, manage.manageAdmin, users]
};

const menuItemsSalesPerson: { items: NavItemType[] } = {
  items: [dashboard]
};

const menuItemsCloser: { items: NavItemType[] } = {
  items: [dashboard, manage.manageCloser]
};

export default { menuItemsAdmin, menuItemsSalesPerson, menuItemsCloser };
