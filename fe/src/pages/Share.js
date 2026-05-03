import React, { useState } from "react";
import axios from "axios";

export default function Share() {
    const [url, setUrl] = useState("");
    const [description, setDescription] = useState("");

    const handleSubmit = async () => {
        const token = localStorage.getItem("token");

        await axios.post("http://localhost:3000/videos",
            { title: "Youtube Video", url , description},
            {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            }
        );

        alert("Shared!");
        window.location = "/";
    };

    return (
        <div style={{ padding: 50, textAlign: "center" }}>
            <h3>Share a Youtube movie</h3>

            <input
                placeholder="Youtube URL"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                style={{ width: 300 }}
            />
            <textarea
                placeholder="Description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                style={{ width: 300, height: 100, marginTop: 10 }}
            />

            <br /><br />

            <button onClick={handleSubmit}>Share</button>
        </div>
    );
}