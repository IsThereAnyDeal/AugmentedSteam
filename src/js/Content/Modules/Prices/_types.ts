export interface TShop {
    id: number,
    name: string,
}

export interface TPrice {
    amount: number,
    amountInt: number,
    currency: string
}

export interface TDrm {
    id: number,
    name: string
}

export interface TPlatform {
    id: number,
    name: string
}

export interface TCurrent {
    shop: TShop,
    price: TPrice,
    regular: TPrice,
    cut: number,
    voucher: string|null,
    flag: "H"|"N"|"S"|null,
    drm: TDrm[],
    platforms: TPlatform[],
    timestamp: string,
    expiry: string|null,
    url: string
}

export interface TLowest {
    shop: TShop,
    price: TPrice,
    regular: TPrice,
    cut: number,
    timestamp: string
}

export interface TPriceOverview {
    current: TCurrent|null,
    lowest: TLowest|null,
    urls: {
        info: string,
        history: string
    }
}

export interface TBundle {
    id: number,
    title: string,
    page: {
        id: number,
        name: string
    },
    url: string,
    details: string,
    isMature: boolean,
    publish: string,
    expiry: string|null,
    country: {
        games: number,
        media: number
    },
    tiers: TTier[]
}

export interface TTier {
    price: TPrice|null,
    games: TBundleGame[]
}

export interface TBundleGame {
    id: string,
    slug: string,
    title: string,
    type: string|null,
    mature: boolean
}
