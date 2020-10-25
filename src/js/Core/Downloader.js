
class Downloader {

    static download(content, filename) {
        const a = document.createElement("a");
        a.href = typeof content === "string" ? content : URL.createObjectURL(content);
        a.download = filename;

        // Explicitly dispatching the click event (instead of just a.click()) will make it work in FF
        a.dispatchEvent(new MouseEvent("click"));
    }
}

export {Downloader};
