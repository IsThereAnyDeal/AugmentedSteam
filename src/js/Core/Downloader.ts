
export default class Downloader {

    static download(content: string|Blob|MediaSource, filename: string): void {
        const a = document.createElement("a");
        a.href = typeof content === "string" ? content : URL.createObjectURL(content);
        a.download = filename;

        // Explicitly dispatching the click event (instead of just a.click()) will make it work in FF
        a.dispatchEvent(new MouseEvent("click"));
    }
}
