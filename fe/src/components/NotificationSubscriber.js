import { useEffect } from "react";
import { toast } from "react-toastify";
import { getCable } from "../lib/actionCableClient";
import { getAccessToken, getCurrentUser } from "../lib/authStorage";

export default function NotificationSubscriber({ user }) {
    useEffect(() => {
        const token = getAccessToken();

        if (!user || !token) return;

        const cable = getCable();

        if (!cable) return;

        const subscription = cable.subscriptions.create("NotificationsChannel", {
            connected() {
                console.log("Connected to NotificationsChannel");
            },

            disconnected() {
                console.log("Disconnected from NotificationsChannel");
            },

            received(data) {
                const currentUser = getCurrentUser();

                window.dispatchEvent(
                    new CustomEvent("video:shared", {
                        detail: data
                    })
                );

                if (currentUser && data.shared_by_id === currentUser.id) {
                    return;
                }

                toast.info(`${data.shared_by_email} shared: ${data.title}`, {
                    icon: "🚀"
                });
            }
        });

        return () => {
            subscription.unsubscribe();
        };
    }, [user?.id]);

    return null;
}