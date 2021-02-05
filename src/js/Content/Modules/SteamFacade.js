
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

    static addToWishlist(appid) {
        return AddToWishlist(appid, "add_to_wishlist_area", "add_to_wishlist_area_success", "add_to_wishlist_area_fail", null, "add_to_wishlist_area2");
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

    static bindTooltips(selector, rgOptions) {
        BindTooltips(selector, rgOptions);
    }

    static setupTooltips(className = "community_tooltip") {
        return SetupTooltips({"tooltipCSSClass": className});
    }

    static vTooltip(selector, method) {
        $J(selector).v_tooltip(method);
    }

    // market

    static calculateFeeAmount(amount, publisherFee) {
        return CalculateFeeAmount(amount, publisherFee);
    }

    static boosterCreatorData() {
        return CBoosterCreator.sm_rgBoosterData;
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

    static scrollOffsetForceRecalc() {
        CScrollOffsetWatcher.ForceRecalc();
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
}

export {SteamFacade};
