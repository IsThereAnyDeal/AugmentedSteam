import Messenger from "@Content/Modules/Messaging/Messenger";
import {MessageHandler} from "@Content/Modules/Messaging/MessageHandler";

export default class SteamFacade {

    // variables

    static global<T=any>(name: string): Promise<T> {
        return Messenger.get(MessageHandler.SteamFacade, "global", [name]);
    }

    static globalExists(name: string): Promise<boolean> {
        return Messenger.get(MessageHandler.SteamFacade, "globalExists", [name]);
    }

    static globalSet(name: string, value: any): void {
        Messenger.call(MessageHandler.SteamFacade, "globalSet", [name, value]);
    }

    // dialogs

    static showDialog(strTitle: string, strDescription: string, rgModalParams?: any): void {
        Messenger.call(MessageHandler.SteamFacade, "showDialog", [strTitle, strDescription, rgModalParams]);
    }

    static showConfirmDialog(
        title: string,
        description: string,
        options: {
            okButton?: string, // Default "OK"
            cancelButton?: string,  // Default "Cancel"
            secondaryActionButton?: string, // Needs a value else won't get rendered
            explicitConfirm?: boolean, // Avoids releasing Enter from auto-confirming
            explicitDismissal?: boolean // Avoids dismissal on clicking on background
        } = {}
    ): Promise<"OK"|"SECONDARY"|"CANCEL"> {
        return Messenger.get(MessageHandler.SteamFacade, "showConfirmDialog", [
            title,
            description,
            options.okButton ?? null,
            options.cancelButton ?? null,
            options.secondaryActionButton ?? null,
            options.explicitConfirm ?? false,
            options.explicitDismissal ?? false
        ]);
    }

    static showAlertDialog(
        strTitle: string,
        strDescription: string,
        strOKButton?: string
    ): Promise<void> {
        return Messenger.get(MessageHandler.SteamFacade, "showAlertDialog", [
            strTitle, strDescription, strOKButton
        ]);
    }

    static showBlockingWaitDialog(strTitle: string, strDescription: string): Promise<void> {
        return Messenger.get(MessageHandler.SteamFacade, "showBlockingWaitDialog", [
            strTitle, strDescription
        ]);
    }

    static dismissActiveModal(id?: string): void {
        Messenger.call(MessageHandler.SteamFacade, "dismissActiveModal", [id]);
    }

    // menu

    static showMenu(elemLink: string, elemPopup: string, align?: string, valign?: string, bLinkHasBorder?: boolean): void {
        Messenger.call(MessageHandler.SteamFacade, "showMenu", [elemLink, elemPopup, align, valign, bLinkHasBorder]);
    }

    static hideMenu(elemLink: string, elemPopup: string): void {
        Messenger.call(MessageHandler.SteamFacade, "hideMenu", [elemLink, elemPopup]);
    }

    static changeLanguage(strTargetLanguage: string, bStayOnPage: boolean): void {
        Messenger.call(MessageHandler.SteamFacade, "changeLanguage", [strTargetLanguage, bStayOnPage]);
    }

    // app pages

    static collapseLongStrings(selector: string): void {
        Messenger.call(MessageHandler.SteamFacade, "collapseLongStrings", [selector]);
    }

    static removeFromWishlist(
        appid: number,
        divToHide: string,
        divToShowSuccess: string,
        divToShowError: string,
        navref?: string,
        divToHide2?: string,
    ): void {
        Messenger.call(MessageHandler.SteamFacade, "removeFromWishlist", [
            appid, divToHide, divToShowSuccess, divToShowError, navref, divToHide2
        ]);
    }

    static addToWishlist(
        appid: number,
        divToHide: string,
        divToShowSuccess: string,
        divToShowError: string,
        navref?: string,
        divToHide2?: string,
    ): void {
        Messenger.call(MessageHandler.SteamFacade, "addToWishlist", [
            appid, divToHide, divToShowSuccess, divToShowError, navref, divToHide2
        ]);
    }

    // events

    static bindAutoFlyoutEvents(): void {
        Messenger.call(MessageHandler.SteamFacade, "bindAutoFlyoutEvents");
    }

    // tooltips

    static vTooltip(selector: string, isHtml: boolean = false): void {
        Messenger.call(MessageHandler.SteamFacade, "vTooltip", [selector, isHtml]);
    }

    // market

    static calculateFeeAmount(amount: number, publisherFee: number): Promise<{
        amount: number,
        fees: number
    }> {
        return Messenger.get(MessageHandler.SteamFacade, "calculateFeeAmount", [amount, publisherFee]);
    }

    static vCurrencyFormat(amount: number, currencyCode: string): Promise<string> {
        return Messenger.get(MessageHandler.SteamFacade, "vCurrencyFormat", [amount, currencyCode])
    }

    // profile home

    static openFriendChatInWebChat(steamid: string, accountid: number): void {
        Messenger.call(MessageHandler.SteamFacade, "openFriendChatInWebChat", [steamid, accountid]);
    }

    // edit guide

    static submitGuide(): void {
        Messenger.call(MessageHandler.SteamFacade, "submitGuide");
    }
}
