export default class GameId {

    static trimStoreId(storeId: string): number {
        return Number(storeId.slice(storeId.indexOf("/") + 1));
    }
}
