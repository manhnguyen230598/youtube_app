import { useState } from "react";

export default function VideoCard({ video }) {
    const [isPlaying, setIsPlaying] = useState(false);

    const getYoutubeId = (url) => {
        if (!url) return "";

        const patterns = [
            /youtube\.com\/watch\?v=([^&]+)/,
            /youtu\.be\/([^?&]+)/,
            /youtube\.com\/shorts\/([^?&]+)/,
            /youtube\.com\/embed\/([^?&]+)/
        ];

        for (const pattern of patterns) {
            const match = url.match(pattern);
            if (match) return match[1];
        }

        return "";
    };

    const youtubeId = getYoutubeId(video.url);
    const thumbnailUrl = youtubeId
        ? `https://img.youtube.com/vi/${youtubeId}/hqdefault.jpg`
        : "";

    return (
        <div style={styles.card}>
            <div style={styles.videoWrapper}>
                {youtubeId && isPlaying ? (
                    <iframe
                        width="400"
                        height="250"
                        src={`https://www.youtube-nocookie.com/embed/${youtubeId}?autoplay=1`}
                        title={video.title}
                        frameBorder="0"
                        loading="lazy"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                        referrerPolicy="strict-origin-when-cross-origin"
                        allowFullScreen
                    />
                ) : youtubeId ? (
                    <button
                        type="button"
                        style={styles.thumbnailButton}
                        onClick={() => setIsPlaying(true)}
                        aria-label={`Play ${video.title}`}
                    >
                        <img
                            src={thumbnailUrl}
                            alt={video.title}
                            width="400"
                            height="250"
                            loading="lazy"
                            style={styles.thumbnailImage}
                        />
                        <span style={styles.playButton}>▶</span>
                    </button>
                ) : (
                    <div style={styles.invalidVideo}>
                        Invalid YouTube URL
                    </div>
                )}
            </div>

            <div style={styles.info}>
                <h3 style={styles.title}>{video.title}</h3>

                <p style={styles.sharedBy}>
                    Shared by: {video.user?.email || "Unknown user"}
                </p>

                <p style={styles.label}>Description:</p>

                <p style={styles.description}>
                    {video.description || "No description"}
                </p>
            </div>
        </div>
    );
}

const styles = {
    card: {
        display: "flex",
        gap: 24,
        alignItems: "flex-start",
        maxWidth: 900,
        width: "100%",
        marginBottom: 32
    },
    videoWrapper: {
        width: 400,
        height: 250,
        flexShrink: 0
    },
    thumbnailButton: {
        position: "relative",
        width: 400,
        height: 250,
        padding: 0,
        border: "none",
        backgroundColor: "#000",
        cursor: "pointer",
        overflow: "hidden"
    },
    thumbnailImage: {
        width: "100%",
        height: "100%",
        objectFit: "cover",
        display: "block"
    },
    playButton: {
        position: "absolute",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        width: 72,
        height: 52,
        borderRadius: 12,
        backgroundColor: "#ff0000",
        color: "#fff",
        fontSize: 30,
        lineHeight: "52px",
        textAlign: "center",
        boxShadow: "0 4px 16px rgba(0, 0, 0, 0.35)"
    },
    info: {
        flex: 1,
        textAlign: "left"
    },
    title: {
        color: "red",
        margin: "0 0 4px 0",
        fontSize: 18
    },
    sharedBy: {
        margin: "0 0 8px 0",
        fontSize: 14
    },
    label: {
        margin: "8px 0 4px 0",
        fontWeight: "bold"
    },
    description: {
        margin: 0,
        fontSize: 14,
        color: "#333",
        whiteSpace: "pre-wrap",
        lineHeight: "1.5"
    },
    invalidVideo: {
        width: 400,
        height: 250,
        backgroundColor: "#eee",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        border: "1px solid #ccc"
    }
};