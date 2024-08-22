
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

export type TCollectionCopiesResponse = Array<{
    id: number,
    game: {
        id: string,
    },
    shop: {
        id: number,
        name: string
    }|null,
    redeemed: boolean,
    price: {
        amount: number,
        amountInt: number,
        currency: string
    },
    note: string|null,
    tags: {
        id: number,
        tag: string,
        color: string|null
    }[],
    added: number
}>;

export type TCollectionCopy = {
    redeemed: boolean,
    shop?: string,
    note?: string,
    tags?: string[],
}