// third-party
import { FormattedMessage } from "react-intl";

// assets
import { BookSaved } from "iconsax-react";

// type
import { NavItemType } from "types/menu";

// icons
// icons
const icons = {
  customers: BookSaved,
};

// ==============================|| MENU ITEMS - PAGES ||============================== //

const crm: NavItemType = {
  id: "crm-pages",
  title: <FormattedMessage id="crm" />,
  type: "group",
  children: [
    {
      id: "customers",
      title: <FormattedMessage id="customers" />,
      type: "item",
      url: "/customers",
      icon: icons.customers,
      target: false,
    },
  ],
};

export default crm;
