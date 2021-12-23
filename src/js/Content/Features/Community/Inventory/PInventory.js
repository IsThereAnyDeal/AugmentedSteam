import {CommunityPage} from "../../CommunityPage";
import {CInventory} from "./CInventory";
import {CCommunityBase} from "../CCommunityBase";

const page = new CommunityPage();

// This regex can't be translated to a match pattern / glob combination in the manifest
if (/^\/(?:id|profiles)\/[^/]+\/inventory\/?$/.test(window.location.pathname)) {
    page.run(CInventory);
} else {
    page.run(CCommunityBase);
}
