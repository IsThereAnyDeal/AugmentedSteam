
export class Clipboard {

    static set(content) {

        // Based on https://stackoverflow.com/a/12693636
        document.oncopy = (e) => {
            e.clipboardData.setData("Text", content);
            e.preventDefault();
        };

        document.execCommand("Copy");
        document.oncopy = null;
    }
}
