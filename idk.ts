// const adventure = require("./adventure")
import {IO, TextNode, TBDNode, PlotNode} from "./adventure"

class StdIO implements IO {
    
    out(text: string) {
        console.log(text);
    }

    in(text: string, callback: (text: string) => void): void {
        callback("1");
    }
}


export function main() {

    let n: TextNode = new TextNode("hi", TBDNode.get());
    n.play(new StdIO());

    const map = new Map();
    map.set('1', new TextNode("hi", TBDNode.get()));
    map.set('2', new TextNode("hello", TBDNode.get()));
    map.set('3', new TextNode("hey", TBDNode.get()));


    let p: PlotNode = new PlotNode("i am plot", map);

    p.play(new StdIO());

}
