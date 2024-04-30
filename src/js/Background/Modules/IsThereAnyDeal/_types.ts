
export interface TShopInfo {
    id: number,
    title: string
}

export type TGetStoreListResponse = TShopInfo[]

export type TLastImportResponse = {
    from: number|null,
    to: number|null
};

export type TInWaitlistResponse = Record<string, boolean>;

export type TInCollectionResponse = Record<string, boolean>;
