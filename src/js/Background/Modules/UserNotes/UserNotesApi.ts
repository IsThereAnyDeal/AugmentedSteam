import type MessageHandlerInterface from "@Background/MessageHandlerInterface";
import IndexedDB from "@Background/Db/IndexedDB";
import {EAction} from "@Background/EAction";
import {Unrecognized} from "@Background/background";

export default class UserNotesApi implements MessageHandlerInterface {

    private getNote(appids: number[]): Promise<Record<number, string|undefined>> {
        return IndexedDB.getObject("notes", appids);
    }

    private async setNote(appid: number, note: string): Promise<void> {
        await IndexedDB.put("notes", note, appid)
    }

    private deleteNote(appid: number): Promise<void> {
        return IndexedDB.delete("notes", appid);
    }

    private async getAllNotes(): Promise<Record<number, string>> {
        const db = IndexedDB.db;
        let cursor = await db.transaction("notes").store.openCursor();

        let result: Record<number, string> = {};
        while (cursor) {
            result[cursor.key] = cursor.value;
            cursor = await cursor.continue();
        }
        return result;
    }

    private async setAllNotes(notes: Record<number|string, string>): Promise<void> {
        await this.clearNotes();

        return IndexedDB.putMany("notes",
            Object.entries(notes).map(([appid, note]) => [Number(appid), note])
        );
    }

    private clearNotes(): Promise<void> {
        return IndexedDB.clear("notes");
    }

    handle(message: any): typeof Unrecognized|Promise<any> {

        switch(message.action) {
            case EAction.Notes_Get:
                return this.getNote(message.params.appids);

            case EAction.Notes_Set:
                return this.setNote(message.params.appid, message.params.note);

            case EAction.Notes_Delete:
                return this.deleteNote(message.params.appid);

            case EAction.Notes_GetAll:
                return this.getAllNotes();

            case EAction.Notes_SetAll:
                return this.setAllNotes(message.params.notes);

            case EAction.Notes_Clear:
                return this.clearNotes();
        }

        return Unrecognized;
    }
}
