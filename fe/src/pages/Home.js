import React, { useEffect, useState } from "react";
import axios from "axios";
import { createConsumer } from "@rails/actioncable";
import VideoCard from "../components/VideoCard";
import { toast } from 'react-toastify'; // Import toast

export default function Home() {
    const [videos, setVideos] = useState([]);

    useEffect(() => {
        fetchVideos();

        // Khởi tạo kết nối Realtime
        const cable = createConsumer("ws://localhost:3000/cable");

        const subscription = cable.subscriptions.create("NotificationsChannel", {
            received(data) {
                toast.info(`${data.user} vừa chia sẻ: ${data.title}`, {
                    icon: "🚀"
                });

                fetchVideos(); // Reload danh sách video
            }
        });

        return () => {
            subscription.unsubscribe();
        };
    }, []);

    const fetchVideos = async () => {
        try {
            const res = await axios.get("http://localhost:3000/videos");
            setVideos(res.data);
        } catch (err) {
            console.error("Lỗi lấy danh sách video", err);
        }
    };

    return (
        <div style={{ padding: 20 }}>
            <h2 style={{ textAlign: 'center' }}>Danh sách Video</h2>
            <div style={styles.grid}>
                {videos.map(v => (
                    <VideoCard key={v.id} video={v} />
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