#!/usr/bin/env node

import {UI, parseJSON} from "./builder"

class StdUI implements UI {

    static readline = require('readline').createInterface({
        input: process.stdin,
        output: process.stdout
    });

    static https = require("https");
    
    print(text: string) {
        console.log(text);
    }

    printOption(key: string, choice: string): void {
        console.log(key + " " + choice);
    }

    input(callback: (text: string) => void): void {
        StdUI.readline.question("Choice: ", callback);
    }

    get(link: string, callback: (text: string) => void): void {
        StdUI.https.get(link, (resp) => {
            let data = "";

            resp.on("data", (chunk) => {
                data += chunk;
            });

            resp.on("end", () => {
                callback(data);
            });
        })
    }

}

const json = `{
    "start": {
        "type": "plot",
        "text": "ooga booga",
        "options": [
            ["1", "the text", "ooo"],
            ["2", "or this hapens", "random node"]
        ]
    },
    "ooo": {
        "type": "text",
        "text": "hello!",
        "node": null
    },
    "random node" : {
        "type": "link",
        "link": "https://raw.githubusercontent.com/RHS-Hackathon-Club/Adventure/main/idk.json",
        "nodeName": "start"
    }
}`

parseJSON(JSON.parse(json)).get("start").play(new StdUI());
