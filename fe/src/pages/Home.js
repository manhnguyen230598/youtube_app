import React, { useCallback, useEffect, useRef, useState } from "react";
import apiClient from "../lib/apiClient";
import VideoCard from "../components/VideoCard";
import VideoModal from "../components/VideoModal";

const FEED_LIMIT = 10;

export default function Home() {
    const [videos, setVideos] = useState([]);
    const [nextCursor, setNextCursor] = useState(null);
    const [hasMore, setHasMore] = useState(true);
    const [loading, setLoading] = useState(false);
    const [selectedVideoId, setSelectedVideoId] = useState(null);

    const loadingRef = useRef(false);
    const sentinelRef = useRef(null);

    const mergeVideos = useCallback((currentVideos, incomingVideos) => {
        const existingIds = new Set(currentVideos.map((video) => video.id));
        const newVideos = incomingVideos.filter((video) => !existingIds.has(video.id));

        return [...currentVideos, ...newVideos];
    }, []);

    const fetchInitialVideos = useCallback(async () => {
        try {
            setLoading(true);
            loadingRef.current = true;

            const res = await apiClient.get(`/videos?limit=${FEED_LIMIT}`);

            setVideos(res.data.videos || []);
            setNextCursor(res.data.meta?.next_cursor || null);
            setHasMore(Boolean(res.data.meta?.has_more));
        } catch (error) {
            console.error("Failed to fetch initial videos", error);
        } finally {
            setLoading(false);
            loadingRef.current = false;
        }
    }, []);

    const loadMoreVideos = useCallback(async () => {
        if (loadingRef.current || !hasMore || !nextCursor) {
            return;
        }

        try {
            setLoading(true);
            loadingRef.current = true;

            const res = await apiClient.get(
                `/videos?limit=${FEED_LIMIT}&cursor=${encodeURIComponent(nextCursor)}`
            );

            const incomingVideos = res.data.videos || [];

            setVideos((currentVideos) => mergeVideos(currentVideos, incomingVideos));
            setNextCursor(res.data.meta?.next_cursor || null);
            setHasMore(Boolean(res.data.meta?.has_more));
        } catch (error) {
            console.error("Failed to load more videos", error);
        } finally {
            setLoading(false);
            loadingRef.current = false;
        }
    }, [hasMore, nextCursor, mergeVideos]);

    const refreshLatestVideos = useCallback(async () => {
        try {
            const res = await apiClient.get(`/videos?limit=${FEED_LIMIT}`);
            const latestVideos = res.data.videos || [];

            setVideos((currentVideos) => {
                const currentIds = new Set(latestVideos.map((video) => video.id));
                const oldVideos = currentVideos.filter((video) => !currentIds.has(video.id));

                return [...latestVideos, ...oldVideos];
            });
        } catch (error) {
            console.error("Failed to refresh latest videos", error);
        }
    }, []);

    useEffect(() => {
        fetchInitialVideos();
    }, [fetchInitialVideos]);

    useEffect(() => {
        const handleVideoShared = () => {
            refreshLatestVideos();
        };

        window.addEventListener("video:shared", handleVideoShared);

        return () => {
            window.removeEventListener("video:shared", handleVideoShared);
        };
    }, [refreshLatestVideos]);

    useEffect(() => {
        const sentinel = sentinelRef.current;

        if (!sentinel) return;

        const observer = new IntersectionObserver(
            (entries) => {
                const firstEntry = entries[0];

                if (firstEntry.isIntersecting) {
                    loadMoreVideos();
                }
            },
            {
                root: null,
                rootMargin: "300px",
                threshold: 0
            }
        );

        observer.observe(sentinel);

        return () => {
            observer.unobserve(sentinel);
            observer.disconnect();
        };
    }, [loadMoreVideos]);


    const selectedVideoIndex = videos.findIndex((video) => video.id === selectedVideoId);
    const selectedVideo = selectedVideoIndex >= 0 ? videos[selectedVideoIndex] : null;

    const openVideoModal = (video) => {
        setSelectedVideoId(video.id);
    };

    const closeVideoModal = () => {
        setSelectedVideoId(null);
    };

    const showPreviousVideo = () => {
        if (selectedVideoIndex > 0) {
            setSelectedVideoId(videos[selectedVideoIndex - 1].id);
        }
    };

    const showNextVideo = () => {
        if (selectedVideoIndex >= 0 && selectedVideoIndex < videos.length - 1) {
            setSelectedVideoId(videos[selectedVideoIndex + 1].id);
        }
    };

    return (

        <div style={{ padding: 20 }}>
            <h2 style={{ textAlign: "center" }}>Shared YouTube Videos</h2>

            <div style={styles.grid}>
                {videos.map((video) => (
                    <VideoCard
                        key={video.id}
                        video={video}
                        onOpen={openVideoModal}
                    />
                ))}
            </div>

            <div ref={sentinelRef} style={styles.sentinel}>
                {loading && <p>Loading more videos...</p>}

                {!loading && !hasMore && videos.length > 0 && (
                    <p>No more videos.</p>
                )}

                {!loading && videos.length === 0 && (
                    <p>No videos shared yet.</p>
                )}
            </div>
            {selectedVideo && (
                <VideoModal
                    video={selectedVideo}
                    onClose={closeVideoModal}
                    onPrevious={showPreviousVideo}
                    onNext={showNextVideo}
                    hasPrevious={selectedVideoIndex > 0}
                    hasNext={selectedVideoIndex < videos.length - 1}
                />
            )}
        </div>
    );
}

const styles = {
    grid: {
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "20px"
    },
    sentinel: {
        minHeight: 80,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "#666"
    }
};