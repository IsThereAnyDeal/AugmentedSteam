interface TShop {
    id: number,
    name: string,
}

export interface TPrice {
    amount: number,
    amountInt: number,
    currency: string
}

interface TDrm {
    id: number,
    name: string
}

interface TPlatform {
    id: number,
    name: string
}

interface TCurrent {
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

interface TLowest {
    shop: TShop,
    price: TPrice,
    regular: TPrice,
    cut: number,
    timestamp: string
}

export interface TPriceOverview {
    current: TCurrent|null,
    lowest: TLowest|null,
    bundled: number,
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

interface TTier {
    price: TPrice|null,
    games: TBundleGame[]
}

interface TBundleGame {
    id: string,
    slug: string,
    title: string,
    type: string|null,
    mature: boolean
}


export interface TFetchPricesMessage {
    action: "prices",
    params: {
        country: string,
        apps: number[],
        subs: number[],
        bundles: number[],
        voucher: boolean,
        shops: number[]
    }
}

export interface TFetchPricesResponse {
    prices: Record<string, TPriceOverview>,
    bundles: TBundle[]
}
