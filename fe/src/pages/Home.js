import React, { useEffect, useState } from "react";
import axios from "axios";
import { createConsumer } from "@rails/actioncable";
import VideoCard from "../components/VideoCard";
import { toast } from "react-toastify";

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || "http://localhost:3000";
const CABLE_URL = process.env.REACT_APP_CABLE_URL || "ws://localhost:3000/cable";

export default function Home({ user }) {
    const [videos, setVideos] = useState([]);

    const fetchVideos = async () => {
        try {
            const res = await axios.get(`${API_BASE_URL}/videos`);
            setVideos(res.data);
        } catch (err) {
            console.error("Failed to fetch videos", err);
        }
    };

    useEffect(() => {
        fetchVideos();
    }, []);

    useEffect(() => {
        const token = localStorage.getItem("token");

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
                const currentUser = JSON.parse(localStorage.getItem("user") || "null");

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