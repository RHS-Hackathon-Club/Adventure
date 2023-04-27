export interface IO {
    out(text: string): void;
    in(text: string, callback: (text: string) => void): void;
}

interface BaseNode {
    play(io: IO): void;
}

export class TBDNode implements BaseNode {

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

export class TextNode implements BaseNode {

    text: string;
    node: BaseNode;

    constructor(text: string, node: BaseNode) {
        this.text = text;
        this.node = node;
    }

    play(io: IO) {
        io.out(this.text);
    }

}

export class PlotNode implements BaseNode {
    
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
        io.in("Choose an option: ", (text: string) => this.choose(io, text))
    }

    choose(io: IO, text: string) {
        let choice = this.options.get(text);
        if (choice !== undefined) {
            choice.node.play(io);
        }
    }

}

class TempNode implements BaseNode {
    
    nodeID: string;

    constructor(nodeID: string) {
        this.nodeID = nodeID;
    }

    play() { }
}

export function parseJSON(json: any) {
    const nodes: any = {};

    for (const nodeName in json) {
        const node = json.nodeName;

        if (node.type === "text") {
            nodes[nodeName] = new TextNode(node.text, new TempNode(node.node));
        } else if (node.type === "plot") {
            
        }
    }
}

/*

{
    "the beginning": {
        "type": "plot",
        "text": "ooga booga",
        "options": {
            "1": "oooo",
            "2": "random node",
            "3": "other random node"
        }
    },

    "oooo": {
        "type": "text",
        "text": "hi",
        "node": "what comes next..." (if null, TBDNode)
    },

    ...
}

*/

// https://www.typescriptlang.org/play
