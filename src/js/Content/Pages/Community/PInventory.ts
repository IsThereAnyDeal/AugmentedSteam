/**
 * @contentScript
 * @match *://steamcommunity.com/(id|profiles)/*\/inventory
 */

import CommunityPage from "../CommunityPage";
import CInventory from "../../Features/Community/Inventory/CInventory";

(new CommunityPage(CInventory)).run();
