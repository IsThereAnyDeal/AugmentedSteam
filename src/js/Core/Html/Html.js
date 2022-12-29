// TODO Accept NodeLists to insert HTML for every node in the list
class HTML {

    static formatUrl(link) {
        const protocolReg = /^[a-z]+:\/\//;
        const _link = protocolReg.test(link) ? link : `//${link}`;
        return this.escape(_link);
    }

    static escape(str) {

        // @see https://stackoverflow.com/a/4835406
        const map = {
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#039;"
        };

        return str.replace(/[&<>"']/g, (m) => { return map[m]; });
    }

    static toDom(html) {
        const template = document.createElement("template");
        template.innerHTML = DOMPurify.sanitize(html);
        return template.content;
    }

    // TODO deprecated, to be removed
    static element(html) {
        return HTML.toElement(html);
    }

    static toElement(html) {
        return HTML.toDom(html).firstElementChild;
    }

    static _getNode(node) {
        let _node = node;

        if (typeof _node === "string") {
            _node = document.querySelector(_node);
        }

        if (_node instanceof Element) {
            return _node;
        }

        console.warn(`${_node} is not an Element.`);
        return null;
    }

    static inner(node, html) {
        const _node = HTML._getNode(node);

        if (_node) {
            _node.innerHTML = DOMPurify.sanitize(html);
        }
        return _node;
    }

    static replace(node, html) {
        const _node = HTML._getNode(node);

        if (!_node) { return null; }

        const dom = HTML.toDom(html); // Support replacing with multiple nodes
        const firstEl = dom.firstElementChild; // Save reference before emptying the docFrag
        _node.replaceWith(dom);

        return firstEl;
    }

    static wrap(wrapper, startEl, endEl = startEl) {
        const _startEl = HTML._getNode(startEl);

        if (!_startEl) { return null; }

        const _endEl = endEl === null ? _startEl.parentElement.lastElementChild : HTML._getNode(endEl);

        const wrappedNodes = [_startEl];
        for (let cur = _startEl; cur.nextElementSibling !== null && cur !== _endEl; cur = cur.nextElementSibling) {
            wrappedNodes.push(cur.nextElementSibling);
        }

        const _wrapper = HTML.toElement(wrapper);
        _startEl.replaceWith(_wrapper);
        _wrapper.append(...wrappedNodes);
        return _wrapper;
    }

    static _adjacent(node, position, html) {
        const _node = HTML._getNode(node);

        if (_node) {
            _node.insertAdjacentHTML(position, DOMPurify.sanitize(html));
        }
        return _node;
    }

    static beforeBegin(node, html) {
        HTML._adjacent(node, "beforebegin", html);
    }

    static afterBegin(node, html) {
        HTML._adjacent(node, "afterbegin", html);
    }

    static beforeEnd(node, html) {
        HTML._adjacent(node, "beforeend", html);
    }

    static afterEnd(node, html) {
        HTML._adjacent(node, "afterend", html);
    }
}

export {HTML};
