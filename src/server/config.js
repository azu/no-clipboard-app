// MIT © 2018 azu
"use strict";
const Store = require("electron-store");
const store = new Store();
export const localTunnel = {
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
export const session = {
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
