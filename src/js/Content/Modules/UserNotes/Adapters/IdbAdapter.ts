import type AdapterInterface from "@Content/Modules/UserNotes/Adapters/AdapterInterface";
import Background from "@Core/Background";
import {EAction} from "@Background/EAction";

export default class IdbAdapter implements AdapterInterface {

    async get(...appids: number[]): Promise<Map<number, string|null>> {
        const notes = await Background.send<Record<number, string|undefined>>(EAction.Notes_Get, {appids});
        return new Map(
            Object.entries(notes)
                .map(([appidStr, note]) => [Number(appidStr), note ?? null]));
    }

    async set(appid: number, note: string): Promise<null> {
        await Background.send(EAction.Notes_Set, {appid, note});
        return null;
    }

    delete(appid: number): Promise<void> {
        return Background.send(EAction.Notes_Delete, {appid});
    }

    export(): Promise<Record<string, string>> {
        return Background.send(EAction.Notes_GetAll);
    }

    import(notes: Record<string, string>): Promise<void> {
        return Background.send(EAction.Notes_SetAll, {notes});
    }

    clear(): Promise<void> {
        return Background.send(EAction.Notes_Clear);
    }
}
