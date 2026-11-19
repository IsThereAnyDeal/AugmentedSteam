import Context from "@Content/Modules/Context/Context";
import {bootstrapLegacy, features} from "@Content/bootstrap";
import commonFeatures from "@Content/Features/Common/_commonFeatures";
import FFriendsCount from "@Content/Features/Community/FriendsThatPlay/FFriendsCount";
import FFriendsPlaytimeSort from "@Content/Features/Community/FriendsThatPlay/FFriendsPlaytimeSort";

export default class CFriendsThatPlay extends Context {}


/**
 * @contentScript
 * @match *://steamcommunity.com/(id|profiles)/*\/friendsthatplay/*
 */
export async function run(): Promise<void> {
    const params = await bootstrapLegacy();
    const context = new CFriendsThatPlay(params);

    const errorPage = document.querySelector(".profile_fatalerror") !== null;

    await features(context, [
        ...commonFeatures(),
        ...(errorPage ? [] : [
            FFriendsCount,
            FFriendsPlaytimeSort,
        ])
    ]);
}