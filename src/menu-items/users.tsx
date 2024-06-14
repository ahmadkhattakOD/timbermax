// third-party
import { FormattedMessage } from "react-intl";

// assets
import { Briefcase, ClipboardTick, ForwardItem, House2, I24Support, MessageProgramming, Money, MoneyTick, UserEdit } from "iconsax-react";

// type
import { NavItemType } from "types/menu";

// icons
// icons
const icons = {
  users: UserEdit,
  invoices: MoneyTick
};

// ==============================|| MENU ITEMS - PAGES ||============================== //

const users: NavItemType = {
  id: "user-pages",
  title: <FormattedMessage id="users" />,
  type: "group",
  children: [
    {
      id: "users",
      title: <FormattedMessage id="users" />,
      type: "item",
      url: "/users",
      icon: icons.users,
      target: false,
    },
    {
      id: "invoices",
      title: <FormattedMessage id="invoices" />,
      type: "item",
      url: "/invoices/users",
      icon: icons.invoices,
      target: false,
    },
  ],
};

export default users;
