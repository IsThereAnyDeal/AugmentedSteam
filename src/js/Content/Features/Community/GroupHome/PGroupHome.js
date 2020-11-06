import {CommunityPage} from "../../CommunityPage";
import {CGroupHome} from "./CGroupHome";
import {CCommunityBase} from "../CCommunityBase";

const page = new CommunityPage();

// This regex can't be translated to a match pattern / glob combination in the manifest
if (/^\/groups\/[^/]+\/?$/.test(window.location.pathname)) {
    page.run(CGroupHome);
} else {
    page.run(CCommunityBase);
}
