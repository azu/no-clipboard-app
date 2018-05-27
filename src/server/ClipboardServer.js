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
const htmlspecialchars = require("htmlspecialchars");
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
const session = {
    get() {
        return store.get("session-id");
    },
    has() {
        return store.has("session-id");
    },
    set(sessionId) {
        store.set("session-id", sessionId);
    }
};
// check "secret-key" header
const sessionChecker = (req, res, next) => {
    const secretKey = req.header("secret-key");
    if (secretKey === session.get()) {
        next();
    } else {
        res.sendStatus(401);
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
        // embed page
        this.app.get("/copy/:title/?", (req, res) => {
            const copyPageHTML = fs.readFileSync(path.join(__dirname, "bookmarklet.html"), "utf-8");
            const embedTitled = copyPageHTML.replace(/{{title}}/g, htmlspecialchars(req.params.title));
            res.send(embedTitled);
        });
        this.app.get("/bookmarklet", (req, res) => {
            const titleMap = {
                "paste-clipboard": "paste-clipboard",
                "copy-clipboard": "copy-clipboard"
            };
            const queryName = req.query.name;
            console.log("?name", queryName);
            const bookmarkletTitle =
                (queryName && titleMap.hasOwnProperty(queryName) && titleMap[queryName]) || titleMap["paste-clipboard"];
            const code = fs.readFileSync(path.join(__dirname, `bookmarklet/${bookmarkletTitle}.js`), "utf-8");
            const localTunnelOrigin = `https://${localTunnel.get()}.localtunnel.me`;
            const embedCode = code
                .replace("{{API_ORIGIN}}", localTunnelOrigin)
                .replace("{{SECRET_KEY}}", session.get());
            const result = bookmarkletter(embedCode);
            res.redirect(`/copy/${bookmarkletTitle}/?${result}`);
        });
        this.app.get("/tunnel", (req, res) => {
            res.json({
                url: this.tunnelURL
            });
        });
        this.app.get("/clipboard", sessionChecker, (req, res) => {
            res.json({
                text: clipboardy.readSync()
            });
        });
        this.app.post("/clipboard", sessionChecker, (req, res) => {
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
        const sessionId = nanoid().toLowerCase();
        session.set(sessionId);
    }

    async restart() {
        await this.stop();
        return this.start();
    }

    start(port = 7678) {
        return new Promise((resolve, reject) => {
            this.app.listen(port, error => {
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
        if (this.app) {
            this.app.close();
        }
        this.tunnel.close();
    }
}
