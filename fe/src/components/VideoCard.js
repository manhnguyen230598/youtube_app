export default function VideoCard({ video }) {
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

    return (
        <div style={styles.card}>
            <div style={styles.videoWrapper}>
                {youtubeId ? (
                    <iframe
                        width="400"
                        height="250"
                        src={`https://www.youtube.com/embed/${youtubeId}`}
                        title={video.title}
                        frameBorder="0"
                        allowFullScreen
                    />
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
        flexShrink: 0
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