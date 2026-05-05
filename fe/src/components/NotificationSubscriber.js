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

                toast.info(
                    <div style={{ lineHeight: 1.4 }}>
                        <div style={{ fontWeight: 700, marginBottom: 4 }}>
                            Có video mới được chia sẻ
                        </div>

                        <div style={{ fontSize: 14 }}>
                            <strong>{data.shared_by_email}</strong>
                        </div>

                        <div
                            style={{
                                fontSize: 13,
                                color: "#555",
                                marginTop: 4,
                                wordBreak: "break-word"
                            }}
                        >
                            {data.title}
                        </div>
                    </div>,
                    {
                        icon: "🚀",
                        autoClose: 6000
                    }
                );
            }
        });

        return () => {
            subscription.unsubscribe();
        };
    }, [user?.id]);

    return null;
}