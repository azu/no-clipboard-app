// MIT © 2018 azu
"use strict";
const express = require("express");
const clipboardy = require("clipboardy");
const bodyParser = require("body-parser");
const fs = require("fs");
const path = require("path");
const bookmarkletter = require("bookmarkletter").bookmarkletter;
const cors = require("cors");
export class ClipboardServer {
    constructor() {
        this.app = express();
        // parse application/x-www-form-urlencoded
        this.app.use(bodyParser.urlencoded({ extended: false }));
        // parse application/json
        this.app.use(bodyParser.json());
        this.app.use(cors());
        this.app.get("/bookmarklet", function(req, res) {
            if (req.url.includes("?")) {
                res.send(fs.readFileSync(path.join(__dirname, "bookmarklet.html"), "utf-8"));
                return;
            }
            const result = bookmarkletter(
                fs.readFileSync(path.join(__dirname, "./bookmarklet/paste-clipboard.js"), "utf-8")
            );
            res.redirect("/bookmarklet?" + result);
        });
        this.app.get("/clipboard", function(req, res) {
            res.json({
                text: clipboardy.readSync()
            });
        });
        this.app.post("/clipboard", function(req, res) {
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

    start(port = 7678) {
        return new Promise((resolve, reject) => {
            this.app.listen(port, function(error) {
                if (error) {
                    reject(error);
                } else {
                    resolve();
                }
            });
        });
    }

    stop() {
        // NOT IMPLEMENT
    }
}
