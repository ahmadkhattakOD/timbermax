// third-party
import { FormattedMessage } from "react-intl";

// assets
import {
  Briefcase,
  ClipboardTick,
  Edit,
  Edit2,
  ForwardItem,
  House2,
  I24Support,
  MessageProgramming,
  Money,
  Profile,
  Setting2,
  UserEdit,
} from "iconsax-react";

// type
import { NavItemType } from "types/menu";

// icons
// icons
const icons = {
  settings: Setting2,
  profile: Profile,
};

// ==============================|| MENU ITEMS - PAGES ||============================== //

const edit: NavItemType = {
  id: "settings",
  type: "group",
  children: [
    {
      id: "settings",
      title: <FormattedMessage id="settings" />,
      type: "collapse",
      icon: icons.settings,
      children: [
        {
          id: "profile",
          title: <FormattedMessage id="profile" />,
          type: "item",
          url: "/profile",
          icon: icons.profile,
          target: false,
        },
      ],
    },
  ],
};

export default edit;
