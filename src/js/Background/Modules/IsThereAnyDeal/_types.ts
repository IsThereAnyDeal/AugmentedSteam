
export interface TShopInfo {
    id: number,
    title: string
}

export type TGetStoreListResponse = TShopInfo[]

export type TLastImportResponse = {
    from: number|null,
    to: number|null
};

export type TSyncEvent = {
    section: string,
    type: "push"|"pull",
    timestamp: number,
    count: number
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

export type TGetNotesApiResponse = Array<{
    gid: string,
    note: string
}>;

export type TNotesList = [number, string][];

export interface TPushNotesStatus {
    pushed: number
    errors: [number, string, Record<string, string|number>|null][]
}