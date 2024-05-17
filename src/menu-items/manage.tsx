// third-party
import { FormattedMessage } from 'react-intl';

// assets
import { BookSquare, I24Support, MessageProgramming, Money } from 'iconsax-react';

// type
import { NavItemType } from 'types/menu';

// icons
// icons
const icons = {
  maintenance: MessageProgramming,
  sales: Money,
  contactus: I24Support
};

// ==============================|| MENU ITEMS - PAGES ||============================== //

const manage: NavItemType = {
  id: 'group-pages',
  title: <FormattedMessage id="manage" />,
  type: 'group',
  children: [
    {
      id: 'sales',
      title: <FormattedMessage id="sales" />,
      type: 'item',
      url: '/sales',
      icon: icons.sales,
      target: false
    }
  ]
};

export default manage;
