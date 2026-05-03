export default function VideoCard({ video }) {
    const getYoutubeId = (url) => {
        const reg = /v=([^&]+)/;
        const match = url.match(reg);
        return match ? match[1] : "";
    };

    return (
        <div style={styles.card}>
            <iframe
                width="400"
                height="250"
                src={`https://www.youtube.com/embed/${getYoutubeId(video.url)}`}
                title="video"
                frameBorder="0"
            />

            <div style={styles.info}>
                <h3 style={styles.title}>{video.title}</h3>
                <p>Shared by: {video.user?.email}</p>

                <div style={styles.stats}>
                    <span>{video.likes || 0} 👍</span>
                    <span style={{ marginLeft: 15 }}>{video.dislikes || 0} 👎</span>
                </div>

                <div style={styles.description}>
                    <strong>Description:</strong>
                    <p style={styles.descText}>{video.description}</p>
                </div>
            </div>
        </div>
    );
}

const styles = {
    card: { display: "flex", marginBottom: 30, gap: 20, alignItems: "flex-start" },
    info: { flex: 1 },
    title: { color: "red", margin: "0 0 5px 0" },
    stats: { margin: "10px 0", fontSize: "18px" },
    description: { marginTop: 10 },
    descText: {
        fontSize: "14px",
        color: "#333",
        whiteSpace: "pre-wrap", // Hiển thị xuống dòng nếu có
        lineHeight: "1.4"
    }
};