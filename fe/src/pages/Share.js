import React, { useState } from "react";
import axios from "axios";
import { getAccessToken } from "../lib/authStorage";

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || "http://localhost:3000";

export default function Share() {
    const [title, setTitle] = useState("");
    const [url, setUrl] = useState("");
    const [description, setDescription] = useState("");

    const handleSubmit = async () => {
        const token = getAccessToken();

        if (!token) {
            alert("Please login before sharing a video.");
            window.location = "/";
            return;
        }

        if (!title || !url) {
            alert("Please enter both title and YouTube URL.");
            return;
        }

        try {
            await axios.post(
                `${API_BASE_URL}/videos`,
                { title, url, description },
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            alert("Video shared successfully!");
            window.location = "/";
        } catch (error) {
            const errors = error.response?.data?.errors;
            alert("Share failed: " + (errors ? errors.join(", ") : "Unknown error"));
        }
    };

    return (
        <div style={{ padding: 50, textAlign: "center" }}>
            <h3>Share a YouTube video</h3>

            <div style={styles.form}>
                <input
                    placeholder="Video title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    style={styles.input}
                />

                <input
                    placeholder="YouTube URL"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    style={styles.input}
                />

                <textarea
                    placeholder="Description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    style={styles.textarea}
                />

                <button onClick={handleSubmit} style={styles.button}>
                    Share
                </button>

                <button
                    onClick={() => (window.location = "/")}
                    style={styles.secondaryButton}
                >
                    Back to Home
                </button>
            </div>
        </div>
    );
}

const styles = {
    form: {
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 12
    },
    input: {
        width: 360,
        padding: 10
    },
    textarea: {
        width: 360,
        height: 100,
        padding: 10
    },
    button: {
        padding: "10px 20px",
        cursor: "pointer"
    },
    secondaryButton: {
        padding: "8px 16px",
        cursor: "pointer",
        backgroundColor: "#eee",
        border: "1px solid #ccc"
    }
};