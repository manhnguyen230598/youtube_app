import React, { useCallback, useEffect, useState } from "react";
import apiClient from "../lib/apiClient";
import VideoCard from "../components/VideoCard";

export default function Home() {
    const [videos, setVideos] = useState([]);

    const fetchVideos = useCallback(async () => {
        try {
            const res = await apiClient.get("/videos?per_page=20");
            setVideos(Array.isArray(res.data) ? res.data : res.data.videos);
        } catch (err) {
            console.error("Failed to fetch videos", err);
        }
    }, []);

    useEffect(() => {
        fetchVideos();
    }, [fetchVideos]);

    useEffect(() => {
        const handleVideoShared = () => {
            fetchVideos();
        };

        window.addEventListener("video:shared", handleVideoShared);

        return () => {
            window.removeEventListener("video:shared", handleVideoShared);
        };
    }, [fetchVideos]);

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