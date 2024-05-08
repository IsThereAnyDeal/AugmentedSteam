
export default class Clipboard {

    static async set(content: string): Promise<boolean> {

        try {
            await navigator.clipboard.writeText(content);
            return true;
        } catch {
            // Ignore error, use fallback
        }

        // Based on https://stackoverflow.com/a/12693636
        function copyHandler(e: ClipboardEvent) {
            e.clipboardData?.setData("text/plain", content);
            e.preventDefault();
        }

        document.addEventListener("copy", copyHandler);
        const result = document.execCommand("copy");
        document.removeEventListener("copy", copyHandler);
        return result;
    }
}
