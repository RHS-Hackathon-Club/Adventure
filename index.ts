#!/usr/bin/env node

import {IO, parseJSON} from "./builder"

class StdIO implements IO {

    static readline = require('readline').createInterface({
        input: process.stdin,
        output: process.stdout
    });

    static https = require("https");
    
    out(text: string) {
        console.log(text);
    }

    in(callback: (text: string) => void): void {
        StdIO.readline.question("Choice: ", callback);
    }

    get(link: string, callback: (text: string) => void): void {
        StdIO.https.get(link, (resp) => {
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
        "node": "do paths work?"
    },
    "random node" : {
        "type": "link",
        "link": "https://raw.githubusercontent.com/RHS-Hackathon-Club/Adventure/main/idk.json",
        "nodeName": "start"
    }
}`

parseJSON(JSON.parse(json)).get("start").play(new StdIO());
