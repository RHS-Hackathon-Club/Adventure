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

import {readFile} from "fs"

function getPath(path: string, callback: (text: string) => void) {
    readFile(path, "utf8", (err, data) => {
        if (err) {
            throw err;
        } else {
            callback(data);
        }
    })
}

getPath("./idk.json", (json: string) => {
    new Game(json, new NodeIO(), getURL, getPath, () => console.log("You've reached a dead end!")).start("start");
});
