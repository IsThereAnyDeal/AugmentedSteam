import {CommunityPage} from "../../CommunityPage";
import {CProfileHome} from "./CProfileHome";
import {CCommunityBase} from "../CCommunityBase";

const page = new CommunityPage();

// This regex can't be translated to a match pattern / glob combination in the manifest
if (/^\/(?:id|profiles)\/[^/]+\/?$/.test(window.location.pathname)) {
    page.run(CProfileHome);
} else {
    page.run(CCommunityBase);
}
