// third-party
import { FormattedMessage } from "react-intl";

// assets
import { BookSaved, People } from "iconsax-react";

// type
import { NavItemType } from "types/menu";

// icons
const icons = {
  crm: People,
  customers: BookSaved,
};

// ==============================|| MENU ITEMS - PAGES ||============================== //

const crm: NavItemType = {
  id: "crm-pages",
  type: "group",
  children: [
    {
      id: 'crm',
      title: <FormattedMessage id="crm" />,
      type: 'collapse',
      icon: icons.crm,
      children: [
        {
          id: "customers",
          title: <FormattedMessage id="customers" />,
          type: "item",
          url: "/customers",
          icon: icons.customers,
          target: false,
        },
      ]
    },
  ],
};

export default crm;
