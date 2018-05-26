// MIT © 2018 azu
"use strict";
const express = require("express");
const clipboardy = require("clipboardy");
const bodyParser = require("body-parser");
const fs = require("fs");
const path = require("path");
const bookmarkletter = require("bookmarkletter").bookmarkletter;
const cors = require("cors");
const localtunnel = require("localtunnel");
const nanoid = require("nanoid");
const Store = require("electron-store");
const store = new Store();
const localTunnel = {
    get() {
        return store.get("localtunnel");
    },
    has() {
        return store.has("localtunnel");
    },
    set(subDomainName) {
        store.set("localtunnel", subDomainName);
    }
};

export class ClipboardServer {
    constructor() {
        if (!localTunnel.has()) {
            this.resetTunnel();
        }

        this.app = express();
        // parse application/x-www-form-urlencoded
        this.app.use(bodyParser.urlencoded({ extended: false }));
        // parse application/json
        this.app.use(bodyParser.json());
        this.app.use(cors());
        this.app.get("/bookmarklet", (req, res) => {
            if (req.url.includes("?")) {
                res.send(fs.readFileSync(path.join(__dirname, "bookmarklet.html"), "utf-8"));
                return;
            }
            const result = bookmarkletter(`
const activeElement = document.activeElement;
fetch("${this.tunnelURL}/clipboard")
    .then(res => {
        return res.json();
    })
    .then(response => {
        if (response.text) {
            activeElement.value = response.text;
        }
    });
`);
            res.redirect("/bookmarklet?" + result);
        });
        this.app.get("/tunnel", (req, res) => {
            res.json({
                url: this.tunnelURL
            });
        });
        this.app.get("/clipboard", (req, res) => {
            res.json({
                text: clipboardy.readSync()
            });
        });
        this.app.post("/clipboard", (req, res) => {
            if (!req.body) {
                return res.sendStatus(400);
            }
            const text = req.body.text;
            if (text) {
                clipboardy.writeSync(text);
            }
            res.sendStatus(200);
        });
    }

    resetTunnel() {
        const subDomainName = nanoid()
            .replace(/[~_]/g, "a")
            .replace(/^\d/, "a")
            .toLowerCase();
        localTunnel.set(subDomainName);
    }

    async restart() {
        await this.stop();
        return this.start();
    }

    start(port = 7678) {
        return new Promise((resolve, reject) => {
            this.app.listen(port, function(error) {
                if (error) {
                    reject(error);
                } else {
                    setTimeout(() => {
                        resolve();
                    }, 100);
                }
            });
        }).then(() => {
            console.log("start to create localtunnel name:" + localTunnel.get());
            return new Promise((resolve, reject) => {
                this.tunnel = localtunnel(port, { subdomain: localTunnel.get() }, (err, tunnel) => {
                    if (err) {
                        this.resetTunnel();
                        this.restart();
                        return reject(error);
                    }
                    // the assigned public url for your tunnel
                    // i.e. https://abcdefgjhij.localtunnel.me
                    this.tunnelURL = tunnel.url;
                    console.log("Localtunnel: " + this.tunnelURL);
                    resolve();
                });
                this.tunnel.on("error", error => {
                    console.error("error", error);
                    this.resetTunnel();
                    this.restart();
                });
            });
        });
    }

    async stop() {
        this.app.close();
        this.tunnel.close();
    }
}
