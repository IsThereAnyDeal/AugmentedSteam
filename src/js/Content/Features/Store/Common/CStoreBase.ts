import Context from "@Content/Modules/Context/Context";
import {bootstrapLegacy, features} from "@Content/bootstrap";
import commonFeatures from "@Content/Features/Common/_commonFeatures";
import storeFeatures from "@Content/Features/Store/storeFeatures";

export default class CStoreBase extends Context {}

/**
 * @contentScript
 * @match *://*.steampowered.com/*
 * @exclude *://store.steampowered.com/dynamicstore/*
 * @exclude *://store.steampowered.com/supportmessages
 * @exclude *://store.steampowered.com/video/*
 * @exclude *://store.steampowered.com/widget[/*]
 * @exclude *://store.steampowered.com/login[/*]
 * @exclude *://store.steampowered.com/join[/*]
 * @exclude *://store.steampowered.com/api/*
 * @exclude *://api.steampowered.com/*
 * @exclude *://help.steampowered.com/*
 * @exclude *://login.steampowered.com/*
 * @exclude *://checkout.steampowered.com/*
 * @exclude *://partner.steampowered.com/*
 * @exclude *://store.steampowered.com/[?*]
 * @exclude *://*.steampowered.com/wishlist/id/*
 * @exclude *://*.steampowered.com/wishlist/profiles/*
 * @exclude *://*.steampowered.com/search[/*]
 * @exclude *://*.steampowered.com/steamaccount/addfunds
 * @exclude *://*.steampowered.com/digitalgiftcards/selectgiftcard
 * @exclude *://*.steampowered.com/account
 * @exclude *://*.steampowered.com/account/licenses
 * @exclude *://*.steampowered.com/account/registerkey
 * @exclude *://*.steampowered.com/bundle/*
 * @exclude *://*.steampowered.com/sub/*
 * @exclude *://*.steampowered.com/app/*
 * @exclude *://*.steampowered.com/agecheck/*
 * @exclude *://*.steampowered.com/points[/*]
 * @exclude *://*.steampowered.com/cart[/*]
 */
export async function run(): Promise<void> {
    const params = await bootstrapLegacy();
    const context = new CStoreBase(params);

    await features(context, [
        ...commonFeatures(),
        ...storeFeatures()
    ]);
}