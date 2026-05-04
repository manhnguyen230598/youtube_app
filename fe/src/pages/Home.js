import React, { useEffect, useState } from "react";
import apiClient from "../lib/apiClient";
import { createConsumer } from "@rails/actioncable";
import VideoCard from "../components/VideoCard";
import { toast } from "react-toastify";
import { getAccessToken, getCurrentUser } from "../lib/authStorage";

const CABLE_URL = process.env.REACT_APP_CABLE_URL || "ws://localhost:3000/cable";

export default function Home({ user }) {
    const [videos, setVideos] = useState([]);

    const fetchVideos = async () => {
        try {
            const res = await apiClient.get("/videos?per_page=20");
            setVideos(Array.isArray(res.data) ? res.data : res.data.videos);
        } catch (err) {
            console.error("Failed to fetch videos", err);
        }
    };

    useEffect(() => {
        fetchVideos();
    }, []);

    useEffect(() => {
        const token = getAccessToken();

        if (!token || !user) {
            return;
        }

        const cable = createConsumer(`${CABLE_URL}?token=${encodeURIComponent(token)}`);

        const subscription = cable.subscriptions.create("NotificationsChannel", {
            connected() {
                console.log("Connected to NotificationsChannel");
            },

            disconnected() {
                console.log("Disconnected from NotificationsChannel");
            },

            received(data) {
                const currentUser = getCurrentUser();

                if (currentUser && data.shared_by_id === currentUser.id) {
                    fetchVideos();
                    return;
                }

                toast.info(`${data.shared_by_email} shared: ${data.title}`, {
                    icon: "🚀"
                });

                fetchVideos();
            }
        });

        return () => {
            subscription.unsubscribe();
            cable.disconnect();
        };
    }, [user]);

    return (
        <div style={{ padding: 20 }}>
            <h2 style={{ textAlign: "center" }}>Shared YouTube Videos</h2>

            <div style={styles.grid}>
                {videos.map((video) => (
                    <VideoCard key={video.id} video={video} />
                ))}
            </div>
        </div>
    );
}

const styles = {
    grid: {
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "20px"
    }
};