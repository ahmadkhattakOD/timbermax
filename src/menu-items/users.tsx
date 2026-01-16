// third-party
import { FormattedMessage } from "react-intl";

// assets
import {
  Briefcase,
  ClipboardTick,
  ForwardItem,
  House2,
  I24Support,
  MessageProgramming,
  Money,
  MoneyTick,
  UserEdit,
  UserTag,
} from "iconsax-react";

// type
import { NavItemType } from "types/menu";

// icons
// icons
const icons = {
  usersHeading: UserTag,
  users: UserEdit,
  invoices: MoneyTick,
};

// ==============================|| MENU ITEMS - PAGES ||============================== //

const users: NavItemType = {
  id: "user-pages",
  type: "group",
  children: [
    {
      id: "usersHeading",
      title: <FormattedMessage id="users" />,
      type: "collapse",
      icon: icons.usersHeading,
      children: [
        {
          id: "users",
          title: <FormattedMessage id="users" />,
          type: "item",
          url: "/users",
          icon: icons.users,
          target: false,
        },
      ],
    },
  ],
};

export default users;
