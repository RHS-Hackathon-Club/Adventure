export interface IO {

    out(text: string): void;

    in(callback: (text: string) => void): void;

    get(link: string, callback: (text: string) => void): void;

}

var _queue = Promise.resolve();

function queue(node: BaseNode, io: IO) {
    _queue = _queue.then(node.play.bind(node, io));
}

export interface BaseNode {

    play(io: IO): void;

}

class TBDNode implements BaseNode {

    private constructor() { }

    play(io: IO) {
        io.out("You've reached a dead end!");
    }

    static #node: TBDNode;

    static {
        TBDNode.#node = new TBDNode();
    }

    static get() {
        return TBDNode.#node;
    }

}

class TextNode implements BaseNode {

    text: string;
    node: BaseNode;

    constructor(text: string, node: BaseNode) {
        this.text = text;
        this.node = node;
    }

    play(io: IO) {
        io.out(this.text);
        queue(this.node, io);
    }

}

class PlotNode implements BaseNode {
    
    text: string;
    options: Map<string, TextNode>;

    constructor(text: string, options: Map<string, TextNode>) {
        this.text = text;
        this.options = options;
    }

    play(io: IO) {
        io.out(this.text);

        for (const [key, value] of this.options) {
            io.out(key + " " + value.text);
        }

        io.in((text: string) => {
            let choice = this.options.get(text);
            if (choice !== undefined) {
                queue(choice.node, io);
            }
        })
    }

}

class LinkedNode implements BaseNode {

    url: string;
    nodeName: string;

    constructor(url: string, nodeName: string) {
        this.url = url
        this.nodeName = nodeName;
    }

    play(io: IO) {
        io.get(this.url, (json) => {
            queue(parseJSON(JSON.parse(json)).get(this.nodeName), io);
        });
    }

}

class TempNode implements BaseNode {
    
    nodeName: string;

    constructor(nodeName: string) {
        this.nodeName = nodeName;
    }

    play() {}
}

export function parseJSON(json: {string: any}): Map<string, BaseNode> {
    const nodes: Map<string, BaseNode> = new Map();

    for (const [nodeName, node] of Object.entries(json)) {
        if (node.type === "text") {
            nodes.set(nodeName, new TextNode(node.text, node.node !== null ? new TempNode(node.node) : TBDNode.get()));
        } else if (node.type === "plot") {
            const options: Map<string, TextNode> = new Map();
            for (const [key, text, nextNodeName] of node.options) {
                options.set(key, new TextNode(text, new TempNode(nextNodeName)));
            }
            nodes.set(nodeName, new PlotNode(node.text, options));
        } else if (node.type === "link") {
            nodes.set(nodeName, new LinkedNode(node.link, node.nodeName));
        } else {
            nodes.set(nodeName, TBDNode.get());
        }
    }

    for (const node of nodes.values()) {
        if (node instanceof TextNode) {
            if (node.node instanceof TempNode) {
                node.node = nodes.get(node.node.nodeName);
            }
        } else if (node instanceof PlotNode) {
            for (const textNode of node.options.values()) {
                if (textNode.node instanceof TempNode) {
                    textNode.node = nodes.get(textNode.node.nodeName);
                    if (textNode.node === undefined) {
                        textNode.node = TBDNode.get();
                    }
                }
            }
        }
    }

    return nodes;
}
