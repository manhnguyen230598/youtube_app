import { useEffect } from "react";
import {
    getYoutubeId,
    getYoutubeEmbedUrl
} from "../lib/youtube";

export default function VideoModal({
    video,
    onClose,
    onPrevious,
    onNext,
    hasPrevious,
    hasNext
}) {
    const youtubeId = getYoutubeId(video?.url);
    const embedUrl = youtubeId ? getYoutubeEmbedUrl(youtubeId) : "";

    useEffect(() => {
        const originalOverflow = document.body.style.overflow;
        document.body.style.overflow = "hidden";

        const handleKeyDown = (event) => {
            if (event.key === "Escape") {
                onClose();
            }

            if (event.key === "ArrowLeft" && hasPrevious) {
                onPrevious();
            }

            if (event.key === "ArrowRight" && hasNext) {
                onNext();
            }
        };

        window.addEventListener("keydown", handleKeyDown);

        return () => {
            document.body.style.overflow = originalOverflow;
            window.removeEventListener("keydown", handleKeyDown);
        };
    }, [onClose, onPrevious, onNext, hasPrevious, hasNext]);

    if (!video) return null;

    return (
        <div style={styles.overlay} onClick={onClose}>
            <div style={styles.modal} onClick={(event) => event.stopPropagation()}>
                <button
                    type="button"
                    style={styles.closeButton}
                    onClick={onClose}
                    aria-label="Close video"
                >
                    ×
                </button>

                <div style={styles.videoArea}>
                    <button
                        type="button"
                        style={{
                            ...styles.navButton,
                            ...styles.leftButton,
                            opacity: hasPrevious ? 1 : 0.35,
                            cursor: hasPrevious ? "pointer" : "not-allowed"
                        }}
                        onClick={onPrevious}
                        disabled={!hasPrevious}
                        aria-label="Previous video"
                    >
                        ‹
                    </button>

                    <div style={styles.playerWrapper}>
                        {embedUrl ? (
                            <iframe
                                width="100%"
                                height="100%"
                                src={embedUrl}
                                title={video.title}
                                frameBorder="0"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                                referrerPolicy="strict-origin-when-cross-origin"
                                allowFullScreen
                            />
                        ) : (
                            <div style={styles.invalidVideo}>
                                Invalid YouTube URL
                            </div>
                        )}
                    </div>

                    <button
                        type="button"
                        style={{
                            ...styles.navButton,
                            ...styles.rightButton,
                            opacity: hasNext ? 1 : 0.35,
                            cursor: hasNext ? "pointer" : "not-allowed"
                        }}
                        onClick={onNext}
                        disabled={!hasNext}
                        aria-label="Next video"
                    >
                        ›
                    </button>
                </div>

                <div style={styles.info}>
                    <h2 style={styles.title}>{video.title}</h2>

                    <p style={styles.sharedBy}>
                        Shared by: {video.user?.email || "Unknown user"}
                    </p>

                    <p style={styles.description}>
                        {video.description || "No description"}
                    </p>
                </div>
            </div>
        </div>
    );
}

const styles = {
    overlay: {
        position: "fixed",
        inset: 0,
        zIndex: 2000,
        backgroundColor: "rgba(0, 0, 0, 0.72)",
        backdropFilter: "blur(5px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24
    },
    modal: {
        position: "relative",
        width: "min(1100px, 96vw)",
        maxHeight: "92vh",
        backgroundColor: "#111",
        color: "#fff",
        borderRadius: 16,
        boxShadow: "0 20px 80px rgba(0, 0, 0, 0.45)",
        overflow: "hidden"
    },
    closeButton: {
        position: "absolute",
        top: 12,
        right: 16,
        zIndex: 3,
        width: 40,
        height: 40,
        border: "none",
        borderRadius: "50%",
        backgroundColor: "rgba(255,255,255,0.12)",
        color: "#fff",
        fontSize: 30,
        lineHeight: "36px",
        cursor: "pointer"
    },
    videoArea: {
        position: "relative",
        width: "100%",
        backgroundColor: "#000",
        display: "flex",
        alignItems: "center",
        justifyContent: "center"
    },
    playerWrapper: {
        width: "100%",
        aspectRatio: "16 / 9",
        maxHeight: "70vh",
        backgroundColor: "#000"
    },
    navButton: {
        position: "absolute",
        top: "50%",
        transform: "translateY(-50%)",
        zIndex: 2,
        width: 52,
        height: 72,
        border: "none",
        borderRadius: 12,
        backgroundColor: "rgba(255,255,255,0.16)",
        color: "#fff",
        fontSize: 54,
        lineHeight: "64px"
    },
    leftButton: {
        left: 16
    },
    rightButton: {
        right: 16
    },
    info: {
        padding: "18px 24px 24px",
        backgroundColor: "#fff",
        color: "#222"
    },
    title: {
        margin: "0 0 8px",
        fontSize: 22,
        color: "#d60000"
    },
    sharedBy: {
        margin: "0 0 12px",
        color: "#555",
        fontSize: 14
    },
    description: {
        margin: 0,
        color: "#333",
        lineHeight: 1.6,
        whiteSpace: "pre-wrap"
    },
    invalidVideo: {
        width: "100%",
        aspectRatio: "16 / 9",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#222",
        color: "#fff"
    }
};