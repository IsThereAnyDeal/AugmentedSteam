import {CProfileHome} from "community/profile_home/CProfileHome";
import {CCommunityBase} from "community/common/CCommunityBase";
import check from "community/communityCheck";

// This regex can't be translated to a match pattern / glob combination in the manifest
if (/^\/(?:id|profiles)\/[^\/]+\/?$/.test(window.location.pathname)) {
    check(CProfileHome);
} else {
    check(CCommunityBase);
}
