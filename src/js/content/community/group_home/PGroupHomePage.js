import {CGroupHomePage} from "./CGroupHomePage";
import {CCommunityBase} from "community/common/CCommunityBase";
import check from "community/communityCheck";

// This regex can't be translated to a match pattern / glob combination in the manifest
if (/^\/groups\/[^\/]+\/?$/.test(window.location.pathname)) {
    check(CGroupHomePage);
} else {
    check(CCommunityBase);
}
