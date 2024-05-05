import type AdapterInterface from "@Content/Modules/UserNotes/Adapters/AdapterInterface";
import {BackgroundSender} from "@Core/BackgroundSimple";
import {EAction} from "@Background/EAction";
import CapacityInfo from "@Content/Modules/UserNotes/CapacityInfo";

export default class IdbAdapter implements AdapterInterface {

    async get(...appids: number[]): Promise<Map<number, string|null>> {
        const notes = await BackgroundSender.send2<Record<number, string|undefined>>(EAction.Notes_Get, {appids});
        return new Map(
            Object.entries(notes)
                .map(([appidStr, note]) => [Number(appidStr), note ?? null]));
    }

    async set(appid: number, note: string): Promise<CapacityInfo> {
        await BackgroundSender.send2(EAction.Notes_Set, {appid, note});
        // FIXME proper capacity
        return new CapacityInfo(false, null);
    }

    delete(appid: number): Promise<void> {
        return BackgroundSender.send2(EAction.Notes_Delete, {appid});
    }

    export(): Promise<Record<string, string>> {
        return BackgroundSender.send2(EAction.Notes_GetAll);
    }

    import(notes: Record<string, string>): Promise<void> {
        return BackgroundSender.send2(EAction.Notes_SetAll, {notes});
    }

    clear(): Promise<void> {
        return BackgroundSender.send2(EAction.Notes_Clear);
    }
}
