import browser, {type Runtime} from "webextension-polyfill";
import Environment, {ContextType} from "@Core/Environment";
import NativeDomParser from "@Background/Modules/Dom/NativeDomParser";

type MessageSender = Runtime.MessageSender;

Environment.CurrentContext = ContextType.Offscreen;

browser.runtime.onMessage.addListener((
    message: {
        domparser?: {
            op: string,
            html: string
        }
    },
    _sender: MessageSender,
    sendResponse: (...params: any) => void
): true|undefined => {
    if (!message || !message.domparser) {
        return;
    }
    const {op, html} = message.domparser;
    const parser = new NativeDomParser();

    switch(op) {
        case "currencyFromWallet":
            sendResponse(parser.parseCurrencyFromWallet(html));
            return;

        case "currencyFromApp":
            sendResponse(parser.parseCurrencyFromApp(html));
            return;

        case "workshopFileSize":
            sendResponse(parser.parseWorkshopFileSize(html));
            return;

        case "reviews":
            sendResponse(parser.parseReviews(html));
            return;

        case "purchaseDates":
            sendResponse(parser.parsePurchaseDates(html));
            return;
    }

    throw new Error("Unknown operation");
});
