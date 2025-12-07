
interface TCardInfo {
    name: string;
    title: string;
    imgurl: string;
    arturl: string;
    owned: 0|1;
    markethash: string;
}

export interface TBadgeData {
    appid: number;
    border: 0|1;
    series: number;
    level: number;
    maxlevel: number;
    name: string; // empty if no badge level
    xp: number;
    nextlevelname: string;
    nextlevelxp: number;
    iconurl: string;
    bMaxed: null|unknown;
    rgCards: TCardInfo[]
}

export interface TLogin {
    steamId: string,
    profilePath: string
}

export interface TReview {
    default: number,
    rating: number,
    helpful: number,
    funny: number,
    length: number,
    visibility: number,
    playtime: number,
    awards: number,
    node: string,
    id: string
}

export interface TFetchBadgeInfoResponse {
    eresult: number,
    badgedata?: TBadgeData
}

export type TFetchReviewsResponse = TReview[];
