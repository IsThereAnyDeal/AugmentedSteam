
export enum ContextId {
    GiftsAndPasses = 1,
    Coupons = 3,
    CommunityItems = 6
}

export interface Asset {
    appid: number,
    contextid: string,
    assetid: string,
    classid: string,
    instanceid: string,
    amount: string
}

/*
 * Only partial description of actual object returned from Steam
 */
export interface Description {
    classid: string,
    instanceid: string
    icon_url: string,
    name: string,
    type: string,
    descriptions: Array<{
        value: string,
        type: string
    }>,
    actions?: Array<{
        link: string
    }>,
    market_hash_name: string
}

export interface InventoryResponse {
    assets?: Asset[],
    descriptions?: Description[],
    success: number,
    more_items?: number,
    last_assetid?: string
}

export interface InventoryData {
    assets: Asset[],
    descriptions: Description[]
}

export interface HasItemResponse {
    [hash: string]: boolean
}
