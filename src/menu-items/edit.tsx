// third-party
import { FormattedMessage } from "react-intl";

// assets
import { Briefcase, ClipboardTick, ForwardItem, House2, I24Support, MessageProgramming, Money, Profile, UserEdit } from "iconsax-react";

// type
import { NavItemType } from "types/menu";

// icons
// icons
const icons = {
  profile: Profile,
};

// ==============================|| MENU ITEMS - PAGES ||============================== //

const edit: NavItemType = {
  id: "edit",
  title: <FormattedMessage id="edit" />,
  type: "group",
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
};

export default edit;
