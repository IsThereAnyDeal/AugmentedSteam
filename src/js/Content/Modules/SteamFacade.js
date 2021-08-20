
/* eslint-disable no-undef,new-cap */

// noinspection JSUnresolvedFunction,JSUnresolvedVariable
class SteamFacade {

    // variables

    static global(name) {
        return window[name];
    }

    static globalSet(name, value) {
        window[name] = value;
    }

    // dialogs

    static showDialog(strTitle, strDescription, rgModalParams) {
        ShowDialog(strTitle, strDescription, rgModalParams);
    }

    static showConfirmDialog(strTitle, strDescription, strOKButton, strCancelButton, strSecondaryActionButton) {
        return ShowConfirmDialog(strTitle, strDescription, strOKButton, strCancelButton, strSecondaryActionButton);
    }

    static showAlertDialog(strTitle, strDescription, strOKButton) {
        return ShowAlertDialog(strTitle, strDescription, strOKButton);
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

    static showMenu(elemLink, elemPopup, align, valign, bLinkHasBorder) {
        return ShowMenu(elemLink, elemPopup, align, valign, bLinkHasBorder);
    }

    static hideMenu(elemLink, elemPopup) {
        return HideMenu(elemLink, elemPopup);
    }

    // app pages

    static collapseLongStrings(selector) {
        return CollapseLongStrings(selector);
    }

    // events

    static bindAutoFlyoutEvents() {
        return BindAutoFlyoutEvents();
    }

    // dynamic store

    static dynamicStoreInvalidateCache() {
        return GDynamicStore.InvalidateCache();
    }

    static dynamicStoreDecorateItems(selector, bForceRecalculate) {
        return GDynamicStore.DecorateDynamicItems($J(selector), bForceRecalculate);
    }

    static onDynamicStoreReady(callback) {
        return GDynamicStore.OnReady(callback);
    }

    static storeItemDataBindHover(selector, unAppID, unPackageID, unBundleID, rgAdditionalParams) {
        GStoreItemData.BindHoverEvents($J(selector), unAppID, unPackageID, unBundleID, rgAdditionalParams);
    }

    // tooltips

    static vTooltip(selector, isHtml = false) {
        const isStore = window.location.host === "store.steampowered.com";

        $J(selector).v_tooltip({
            "tooltipClass": isStore ? "store_tooltip" : "community_tooltip",
            "dataName": isHtml ? "tooltipHtml" : "tooltipText",
            "defaultType": isHtml ? "html" : "text",
            "replaceExisting": false
        });
    }

    // market

    static calculateFeeAmount(amount, publisherFee) {
        return CalculateFeeAmount(amount, publisherFee);
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

    static scrollOffsetForceRecalc() {
        CScrollOffsetWatcher.ForceRecalc();
    }

    static loadImageGroupOnScroll(elTarget, strGroup) {
        LoadImageGroupOnScroll(elTarget, strGroup);
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
        pricehistory_zoomDays(SellItemDialog.m_plotPriceHistory, SellItemDialog.m_timePriceHistoryEarliest, SellItemDialog.m_timePriceHistoryLatest, 365);
    }
      
    // selections

    static updateSelection() {
        return UpdateSelection();
    }

    static selectAll() {
        return selectAll();
    }

    static selectNone() {
        return selectNone();
    }

    static selectInverse() {
        return selectInverse();
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
}

export {SteamFacade};
