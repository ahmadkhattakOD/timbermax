// project import
import samplePage from './sample-page';
import support from './support';
import pages from './pages';

// types
import { NavItemType } from 'types/menu';
import manage from './manage';

// ==============================|| MENU ITEMS ||============================== //

const menuItems: { items: NavItemType[] } = {
  items: [samplePage, manage]
};

export default menuItems;
