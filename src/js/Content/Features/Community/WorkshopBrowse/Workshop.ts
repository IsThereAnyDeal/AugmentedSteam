import RequestData from "@Content/Modules/RequestData";
import type UserInterface from "@Core/User/UserInterface";

export default class Workshop {

    constructor(
        private readonly user: UserInterface
    ) {}

    async changeSubscription(id: string, appid: number, method: string = "subscribe"): Promise<void> {
        if (!this.user.sessionId) {
            throw new Error();
        }

        const _method = method === "subscribe" ? method : "unsubscribe";

        const data = {
            sessionid: this.user.sessionId,
            appid: String(appid),
            id
        };

        const response = await RequestData.post(`https://steamcommunity.com/sharedfiles/${_method}`, data);

        if (method === "subscribe") {
            const data = await response.json();
            // https://github.com/SteamDatabase/SteamTracking/blob/3ab40a4604426852de8a51c50d963978e9660de4/steamcommunity.com/public/javascript/sharedfiles_functions_logged_in.js#L533
            switch (data.success) {
                case 1: break;
                case 15: throw new Error("You do not have permission to subscribe to this item.");
                case 25: throw new Error("You cannot subscribe to this item because you have reached the limit of 15,000 subscriptions across all products on Steam.");
                default: throw new Error("There was a problem trying to subscribe to this item. Please try again later.");
            }
        }
    }
}
