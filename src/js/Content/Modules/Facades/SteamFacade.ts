import Messenger from "@Content/Modules/Messaging/Messenger";
import {MessageHandler} from "@Content/Modules/Messaging/MessageHandler";

export default class SteamFacade {

    // variables

    static global<T=any>(name: string): Promise<T> {
        return Messenger.get(MessageHandler.SteamFacade, "global", [name]);
    }

    static globalSet(name: string, value: any): void {
        Messenger.call(MessageHandler.SteamFacade, "globalSet", [name, value]);
    }

    // dialogs

    static showDialog(strTitle, strDescription, rgModalParams) {
        ShowDialog(strTitle, strDescription, rgModalParams);
    }

    static showConfirmDialog(
        strTitle: string,
        strDescription: string,
        strOKButton: string|null=null,
        strCancelButton: string|null=null,
        strSecondaryActionButton: string|null=null
    ): Promise<"OK"|"SECONDARY"|"CANCEL"> {
        return Messenger.get(MessageHandler.SteamFacade, "showConfirmDialog", [
            strTitle, strDescription, strOKButton, strCancelButton, strSecondaryActionButton
        ]);
    }

    static showAlertDialog(
        strTitle: string,
        strDescription: string,
        strOKButton: string|null=null
    ): void {
        Messenger.call(MessageHandler.SteamFacade, "showAlertDialog", [
            strTitle, strDescription, strOKButton
        ]);
    }

    static showBlockingWaitDialog(strTitle, strDescription) {
        return ShowBlockingWaitDialog(strTitle, strDescription);
    }

    static showNicknameModal() {
        return ShowNicknameModal();
    }

    static dismissActiveModal() {
        CModal.DismissActiveModal();
    }

    // menu

    static showMenu(elemLink: string, elemPopup: string, align: string, valign: string, bLinkHasBorder: boolean): void {
        Messenger.call(MessageHandler.SteamFacade, "showMenu", [elemLink, elemPopup, align, valign, bLinkHasBorder]);
    }

    static hideMenu(elemLink: string, elemPopup: string): void {
        Messenger.call(MessageHandler.SteamFacade, "hideMenu", [elemLink, elemPopup]);
    }

    static changeLanguage(strTargetLanguage: string, bStayOnPage: boolean): void {
        Messenger.call(MessageHandler.SteamFacade, "changeLanguage", [strTargetLanguage, bStayOnPage]);
    }

    // app pages

    static collapseLongStrings(selector) {
        return CollapseLongStrings(selector);
    }

    static adjustVisibleAppTags(selector) {
        return AdjustVisibleAppTags($J(selector));
    }

    static updatePlaytimeFilterValues(hourMin, hourMax) {
        return UpdatePlaytimeFilterValues(hourMin, hourMax);
    }

    // @param appid required, rest is optional
    static removeFromWishlist(appid, divToHide, divToShowSuccess, divToShowError, navref, divToHide2) {
        return RemoveFromWishlist(appid, divToHide, divToShowSuccess, divToShowError, navref, divToHide2);
    }

    // @param subid can be number or array
    static addItemToCart(subid, bundleid, navdata) {
        return window.AddItemToCart(subid, bundleid, navdata);
    }

    // events

    static bindAutoFlyoutEvents() {
        return BindAutoFlyoutEvents();
    }

    static sliderOnChange(value) {
        return g_player.SliderOnChange(value);
    }

    // dynamic store

    static dynamicStoreInvalidateCache() {
        return GDynamicStore.InvalidateCache();
    }

    static dynamicStoreDecorateItems(selector, bForceRecalculate) {
        return GDynamicStore.DecorateDynamicItems($J(selector), bForceRecalculate);
    }

    static storeItemDataBindHover(selector, unAppID, unPackageID, unBundleID, rgAdditionalParams) {
        GStoreItemData.BindHoverEvents($J(selector), unAppID, unPackageID, unBundleID, rgAdditionalParams);
    }

    // tooltips

    static vTooltip(selector, isHtml = false) {
        const isStore = window.location.host === "store.steampowered.com";

        $J(selector).v_tooltip({
            "tooltipClass": isStore ? "store_tooltip" : "community_tooltip",
            "dataAttr": isHtml ? "data-tooltip-html" : "data-tooltip-text",
            "defaultType": isHtml ? "html" : "text",
            "replaceExisting": true
        });
    }

    // market

    static calculateFeeAmount(amount, publisherFee) {
        return CalculateFeeAmount(amount, publisherFee);
    }

    static calculateAmountToSendForDesiredReceivedAmount(receivedAmount, publisherFee) {
        return CalculateAmountToSendForDesiredReceivedAmount(receivedAmount, publisherFee);
    }

    static vCurrencyFormat(amount, currencyCode) {
        return v_currencyformat(amount, currencyCode);
    }

    // friends

    static toggleManageFriends() {
        return ToggleManageFriends();
    }

    static openFriendChatInWebChat(chatId) {
        return OpenFriendChatInWebChat(chatId);
    }

    // community

    static submitGuide() {
        return SubmitGuide();
    }

    static initMiniprofileHovers() {
        return InitMiniprofileHovers();
    }

    static inviteUserToGroup(Modal, groupID, steamIDInvitee) {
        return InviteUserToGroup(Modal, groupID, steamIDInvitee);
    }

    static getCheckedAccounts(selector) {
        return GetCheckedAccounts(selector);
    }

    static execFriendAction(action, navid) {
        return ExecFriendAction(action, navid);
    }

    static loadImageGroupOnScroll(elTarget, strGroup) {
        LoadImageGroupOnScroll(elTarget, strGroup);
    }

    static showModalContent(url, titleBarText, titleBarURL, sizeToFit) {
        ShowModalContent(url, titleBarText, titleBarURL, sizeToFit);
    }

    // inventory

    static firstPage() {
        return InventoryFirstPage();
    }

    static lastPage() {
        return InventoryLastPage();
    }

    static goToPage() {
        return InventoryGoToPage();
    }

    static reloadCommunityInventory() {
        return ReloadCommunityInventory();
    }

    static getMarketHashName(itemDesc) {
        return GetMarketHashName(itemDesc);
    }

    static zoomYear() {
        pricehistory_zoomDays(g_plotPriceHistory, g_timePriceHistoryEarliest, g_timePriceHistoryLatest, 365);
    }

    static zoomYearForSellDialog() {
        pricehistory_zoomDays(
            SellItemDialog.m_plotPriceHistory,
            SellItemDialog.m_timePriceHistoryEarliest,
            SellItemDialog.m_timePriceHistoryLatest,
            365
        );
    }

    // selections

    static updateSelection() {
        return UpdateSelection();
    }

    static selectAll() {
        return SelectAll();
    }

    static selectNone() {
        return SelectNone();
    }

    static selectInverse() {
        return SelectInverse();
    }

    // Wishlist

    static wishlistOnScroll() {
        return g_Wishlist.OnScroll();
    }

    // jQuery functions

    static jq(selector) {
        return $J(selector);
    }

    static jqOnClick(selector, callback) {
        $J(selector).on("click", callback);
    }

    static jqAjax(settings) {
        return $J.ajax(settings);
    }

    static jqGet(url, settings) {
        return $J.get(url, settings);
    }

    static jqPost(url, settings) {
        return $J.post(url, settings);
    }

    static jqTrigger(selector, eventName) {
        return $J(selector).trigger(eventName);
    }
}
