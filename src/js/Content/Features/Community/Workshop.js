import {RequestData, User} from "../../modulesContent";

export default class Workshop {

    static async changeSubscription(id, appid, method = "subscribe") {

        const _method = method === "subscribe" ? method : "unsubscribe";

        const formData = new FormData();
        formData.append("sessionid", User.sessionId);
        formData.append("appid", appid);
        formData.append("id", id);

        const res = await RequestData.post(`https://steamcommunity.com/sharedfiles/${_method}`, formData, {}, true);

        if (!res || !res.success) {
            throw new Error("Bad response");
        }
    }
}
