import Background from "@Core/Background";
import {EAction} from "@Background/EAction";

export default class SteamWebApiFacade {

    static getFamilyLibrary(accessToken: string, steamId: string): Promise<{shareable: number[], owned: number[]}> {
        return Background.send(EAction.FamilyLibrary_Apps, {accessToken, steamId});
    }
}
