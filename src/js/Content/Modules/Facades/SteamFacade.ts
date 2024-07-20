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

    static showDialog(strTitle: string, strDescription: string, rgModalParams: any=undefined): void {
        Messenger.call(MessageHandler.SteamFacade, "showDialog", [strTitle, strDescription, rgModalParams]);
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

    static dismissActiveModal() {
        Messenger.call(MessageHandler.SteamFacade, "dismissActiveModal");
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

    // @param appid required, rest is optional
    static removeFromWishlist(
        appid: number,
        divToHide: string|undefined = undefined,
        divToShowSuccess: string|undefined = undefined,
        divToShowError: string|undefined = undefined,
        navref: string|undefined = undefined,
        divToHide2: string|undefined = undefined,
    ) {
        Messenger.call(MessageHandler.SteamFacade, "removeFromWishlist", [
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
}
