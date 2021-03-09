import {RequestData, User} from "../../modulesContent";

export default class Workshop {

    static async changeSubscription(id, appid, method = "subscribe") {

        const _method = method === "subscribe" ? method : "unsubscribe";

        const formData = new FormData();
        formData.append("sessionid", User.sessionId);
        formData.append("appid", appid);
        formData.append("id", id);

        const res = await RequestData.post(`https://steamcommunity.com/sharedfiles/${_method}`, formData, {}, true);

        if (method === "subscribe") {
            // https://github.com/SteamDatabase/SteamTracking/blob/3ab40a4604426852de8a51c50d963978e9660de4/steamcommunity.com/public/javascript/sharedfiles_functions_logged_in.js#L533
            switch (res.success) {
                case 1: break;
                case 15: throw new Error("You do not have permission to subscribe to this item.");
                case 25: throw new Error("You cannot subscribe to this item because you have reached the limit of 15,000 subscriptions across all products on Steam.");
                default: throw new Error("There was a problem trying to subscribe to this item. Please try again later.");
            }
        }

        return res;
    }
}
