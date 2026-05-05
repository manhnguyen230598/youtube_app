import { createConsumer } from "@rails/actioncable";
import { getAccessToken } from "./authStorage";

const CABLE_URL = process.env.REACT_APP_CABLE_URL || "ws://localhost:3000/cable";

let cable = null;
let cableToken = null;

function buildCableUrl(token) {
    const url = new URL(CABLE_URL, window.location.origin);
    url.searchParams.set("token", token);
    return url.toString();
}

export function getCable() {
    const token = getAccessToken();

    if (!token) {
        return null;
    }

    if (!cable || cableToken !== token) {
        if (cable) {
            cable.disconnect();
        }

        cableToken = token;
        cable = createConsumer(buildCableUrl(token));
    }

    return cable;
}

export function disconnectCable() {
    if (cable) {
        cable.disconnect();
    }

    cable = null;
    cableToken = null;
}