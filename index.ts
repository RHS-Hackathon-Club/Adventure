#!/usr/bin/env node

import {IO, Game} from "./adventure"

class NodeIO implements IO {

    static readline = require('readline').createInterface({
        input: process.stdin,
        output: process.stdout
    });

    displayText(text: string, callback: () => void): void {
        console.log(text);
        callback();
    }

    displayForkText(text: string): void {
        console.log(text);
    }

    displayForkOption(key: string, option: string): void {
        console.log(key + " " + option);
    }

    choose(callback: (key: string) => void): void {
        NodeIO.readline.question("Choice: ", callback);
    }

}

import {get} from "https";

function getURL(url: string, callback: (text: string) => void) {
    get(url, (resp: any) => {
        let data = "";

        resp.on("data", (chunk: string) => {
            data += chunk;
        });

        resp.on("end", () => {
            callback(data);
        });
    });
}

const json = `{
    "start": {
        "type": "fork",
        "text": "ooga booga",
        "options": [
            ["1", "the text", "ooo"],
            ["2", "or this hapens", "random node"]
        ]
    },
    "ooo": {
        "type": "road",
        "text": "hello!",
        "next": null
    },
    "random node" : {
        "type": "link",
        "url": "https://raw.githubusercontent.com/RHS-Hackathon-Club/Adventure/boss/oogieboogie.json",
        "next": "start"
    }
}`

const game = new Game(json, new NodeIO(), getURL, null, () => console.log("You've reached a dead end!"));
game.start("start");