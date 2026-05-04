import { createConsumer } from "@rails/actioncable";
import { getAccessToken } from "./authStorage";

const CABLE_URL = process.env.REACT_APP_CABLE_URL || "ws://localhost:3000/cable";

let cable = null;

export function getCable() {
    const token = getAccessToken();

    if (!token) {
        return null;
    }

    if (!cable) {
        cable = createConsumer(`${CABLE_URL}?token=${encodeURIComponent(token)}`);
    }

    return cable;
}

export function disconnectCable() {
    if (cable) {
        cable.disconnect();
        cable = null;
    }
}