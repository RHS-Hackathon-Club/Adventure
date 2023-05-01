export interface UI {

    displayText(text: string): void;

    displayOptionText(text: string): void;

    displayOption(key: string, choice: string): void;

    get(link: string, callback: (text: string) => void): void;

}

// UI needs to pull at game: UI decides when game proceeds
// game just needs to provide API to control what happens when

// game.start()
// // plays first node and waits
// game.choose()
// // proceeds to next node

export class Game {

    #next = null;
    #ui: UI;
    #nodes: Map<string, BaseNode>;
    #currentPlay = Promise.resolve();

    constructor(json: {string: any}, ui: UI) {
        this.#ui = ui;
        this.#nodes = parseJSON(json);
    }

    start(nodeName: string) {
        const node = this.#nodes.get(nodeName);
        this.#currentPlay = this.#currentPlay.then(node.play.bind(node, this));
    }

    choose(key: string) {
        if (this.#next !== null) {
            const func = this.#next;
            this.#next = null;
            func(key);
        }
        // call callback in the current node if it is a choice node or proceed to next node
        // if it is a text node (even if it is in the middle of printing)
    }

    // when node is done playing, calls callback with next node
    // make play() async so it can "return" a value and be one function (or .then it)

    next(callback: (input: string) => void) {
        this.#next = callback;
    }

    displayText(text: string) {
        this.#ui.displayText(text);
    }

    displayOptionText(text: string) {
        this.#ui.displayOptionText(text);

    }

    displayOption(key: string, choice: string) {
        this.#next.displayOption(key, choice);
    }

    get(link: string, callback: (text: string) => void) {
        this.#next.get(link, callback);
    }

}

var _queue = Promise.resolve();

function queue(node: BaseNode, game: Game) {
    _queue = _queue.then(node.play.bind(node, game));
}

export interface BaseNode {

    play(game: Game): void;

}

class TBDNode implements BaseNode {

    private constructor() { }

    play(game: Game) {
        game.displayText("You've reached a dead end!");
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

    play(game: Game) {
        game.next(this.node.play.bind(this.node, game));
        game.displayText(this.text);
    }

}

class PlotNode implements BaseNode {
    
    text: string;
    options: Map<string, TextNode>;

    constructor(text: string, options: Map<string, TextNode>) {
        this.text = text;
        this.options = options;
    }

    async play(game: Game) {
        game.displayOptionText(this.text);

        for (const [key, value] of this.options) {
            game.displayOption(key, value.text);
        }

        game.next((text: string) => {
            let choice = this.options.get(text);
            if (choice !== undefined) {
                queue(choice.node, game);
            }
        });
    }

}

class LinkedNode implements BaseNode {

    url: string;
    nodeName: string;

    constructor(url: string, nodeName: string) {
        this.url = url
        this.nodeName = nodeName;
    }

    play(game: Game) {
        game.get(this.url, (json) => {
            queue(parseJSON(JSON.parse(json)).get(this.nodeName), game);
        });
    }

}

class TempNode implements BaseNode {

    nodeName: string;

    constructor(nodeName: string) {
        this.nodeName = nodeName;
    }

    play(game: Game) {
        game.displayText(`This is a temporary node linked to '${this.nodeName}'.`);
    }

}

function parseJSON(json: {string: any}): Map<string, BaseNode> {
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
