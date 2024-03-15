
interface TShopInfo {
    id: number,
    title: string,
    deals: number,
    games: number,
    update: string
}

export interface TGetStoreListMessage {
    action: "itad.storelist"
}

export type TGetStoreListResponse = TShopInfo[]
