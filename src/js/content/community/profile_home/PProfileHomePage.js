import {CProfileHomePage} from "community/profile_home/CProfileHomepage";
import {CCommunityBase} from "community/common/CCommunityBase";
import check from "community/communityCheck";

// This regex can't be translated to a match pattern / glob combination in the manifest
if (/^\/(?:id|profiles)\/[^\/]+\/?$/.test(window.location.pathname)) {
    check(CProfileHomePage);
} else {
    check(CCommunityBase);
}
