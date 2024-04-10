
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

export interface TFetchBadgeInfoMessage {
    action: "community.badgeinfo",
    params: {
        steamId: string,
        appid: number
    }
}

export interface TFetchBadgeInfoResponse {
    eresult: number,
    badgedata?: TBadgeData
}
