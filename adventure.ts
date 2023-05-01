/**
 * The interface to provide I/O services to {@link Game}.
 */
export interface IO {

    /**
     * Displays the text of a road.
     * @param text - the text to display
     * @param callback - a callback that must be called to resume play
     */
    displayText(text: string, callback: () => void): void;

    /**
     * Displays the text preceding options from a fork.
     * @param text - the context text to display
     */
    displayForkText(text: string): void;

    /**
     * Displays an option and its key from a fork.
     * @param key - the text that represents this option
     * @param option - the text explaining the option
     */
    displayForkOption(key: string, option: string): void;

    /**
     * Signals that an option needs to be picked from a fork.
     * @param callback - the callback to call when an option is
     * chosen
     */
    choose(callback: (key: string) => void): void;

}

/**
 * A game of Adventure.
 */
export class Game {

    io: IO;
    getURL?: (url: string, callback: (text: string) => void) => void;
    getPath?: (path: string, callback: (text: string) => void) => void;
    end?: () => void;

    #nodes: Map<string, Node>;

    /**
     * The constructor.
     * @param json - the JSON string to parse the story tree from
     * @param io - the {@link IO} object to allow play interface
     * @param getURL - an optional method to GET from a url into a callback
     * @param getPath - an optional method to read from a file into a callback
     * @param end - an optional method that is called when a {@link Dead} end is played
     */
    constructor(
        json: string, io: IO,
        getURL?: (url: string, callback: (text: string) => void) => void,
        getPath?: (path: string, callback: (text: string) => void) => void,
        end?: () => void
    ) {
        this.#nodes = parseJSON(json);
        this.io = io;
        this.getURL = getURL;
        this.getPath = getPath;
        this.end = end;
    }

    /**
     * Starts the game by playing a node.
     * @param key - the key that represents the node to begin with
     */
    start(key: string) {
        const node = this.#nodes.get(key);
        if (node === undefined) {
            throw new Error(`Node '${key}' does not exist.`);
        }
        this.run(node);
    }

    /**
     * Plays a node.
     */
    run(node: Node) {
        Promise.resolve().then(node.play.bind(node, this));
    }

}

/**
 * The interface of a point on the story tree.
 */
interface Node {

    /**
     * Runs this node by displaying text, calling for
     * input, and/or querying the internet.
     * @param game - the {@link Game} the node is in
     */
    play(game: Game): void;

}

/**
 * A spot on the story line.
 */
class Road implements Node {

    text: string;
    next: Node;

    constructor(text: string, next: Node) {
        this.text = text;
        this.next = next;
    }

    play(game: Game): void {
        game.io.displayText(this.text, game.run.bind(game, this.next));
    }

}

/**
 * A split in the story line.
 */
class Fork implements Node {

    text: string;
    options: Map<string, Road>;

    constructor(text: string, options: Map<string, Road>) {
        this.text = text;
        this.options = options;
    }

    play(game: Game): void {
        game.io.displayForkText(this.text);

        for (const [key, option] of this.options) {
            game.io.displayForkOption(key, option.text);
        }

        game.io.choose((key: string) => {
            const option = this.options.get(key);
            if (option !== undefined) {
                game.run(option.next);
            } else {
                throw new Error(`Choice '${key}' does not exist.`);
            }
        });
    }

}

/**
 * A node at a url.
 */
class Link implements Node {

    url: string;
    key: string;

    constructor(url: string, key: string) {
        this.url = url;
        this.key = key;
    }

    play(game: Game): void {
        game.getURL(this.url, (text: string) => {
            const option = parseJSON(text).get(this.key);
            if (option !== undefined) {
                game.run(option);
            } else {
                throw new Error(`Node '${this.key}' does not exist at url.`);
            }
        });
    }

}

/**
 * A node at a file.
 */
class File implements Node {

    path: string;
    key: string;

    constructor(path: string, key: string) {
        this.path = path;
        this.key = key;
    }

    play(game: Game): void {
        game.getPath(this.path, (text: string) => {
            const option = parseJSON(text).get(this.key);
            if (option !== undefined) {
                game.run(option);
            } else {
                throw new Error(`Node '${this.key}' does not exist at url.`);
            }
        });
    }

}

/**
 * A singleton dead end.
 */
class Dead implements Node {

    private constructor() {}

    play(game: Game): void {
        game.end();
    }

    static #node: Dead;

    static {
        this.#node = new Dead();
    }

    static get() {
        return Dead.#node;
    }

}

/**
 * A temporary node used when building the node tree.
 */
class Temp implements Node {

    key: string;

    constructor(key: string) {
        this.key = key;
    }

    play(game: Game): void {
        game.io.displayText(`This is a temporary node linked to '${this.key}'.`, () => {});
    }

}

/**
 * A utility function for {@link parseJSON} to wrap a node's key accordingly.
 * @param key - the key of the node
 * @returns a {@link Dead} or {@link Temp} node depending on if the key is null or not
 */
function tempOrDead(key: string) {
    return key !== null ? new Temp(key) : Dead.get();
}

/**
 * Parses and wraps JSON into a map of string keys to {@link Node Nodes}.
 * @param json - a string of valid JSON data
 * @returns a map of keys to their {@link Node Nodes}
 */
function parseJSON(json: string): Map<string, Node> {
    const nodes: Map<string, Node> = new Map();
    let node: Node;

    for (const [key, rawNode] of Object.entries(JSON.parse(json)) as [string, any][]) {
        switch (rawNode.type) {

            case "road":
                node = new Road(rawNode.text, tempOrDead(rawNode.next));
                break;

            case "fork":
                const options: Map<string, Road> = new Map();
                for (const [optionKey, text, nextKey] of rawNode.options) {
                    options.set(optionKey, new Road(text, tempOrDead(nextKey)));
                }
                node = new Fork(rawNode.text, options);
                break;

            case "link":
                node = new Link(rawNode.url, rawNode.next);
                break;

            case "file":
                node = new File(rawNode.path, rawNode.next);
                break;

            default:
                throw new Error(`Node type '${rawNode.type}' does not exist (at node '${key}.')`);

        }

        nodes.set(key, node);
    }

    for (const node of nodes.values()) {
        if (node instanceof Road) {
            if (node.next instanceof Temp) {
                const key = node.next.key;
                node.next = nodes.get(key);
                if (node.next === undefined) {
                    throw new Error(`Node '${key}' does not exist.`);
                }
            }
        } else if (node instanceof Fork) {
            for (const road of node.options.values()) {
                if (road.next instanceof Temp) {
                    const key = road.next.key;
                    road.next = nodes.get(key);
                    if (road.next === undefined) {
                        throw new Error(`Node '${key}' does not exist.`);
                    }
                }
            }
        }
    }

    return nodes;
}