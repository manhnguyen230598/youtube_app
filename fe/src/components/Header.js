import React, { useState } from "react";
import axios from "axios";
import {
    setAuthTokens,
    setCurrentUser
} from "../lib/authStorage";

export default function Header({ user, onLogout, setUser }) {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    // Hàm xử lý Đăng nhập
    const handleLogin = async () => {
        if (!email || !password) return alert("Vui lòng nhập đầy đủ thông tin");
        try {
            const response = await axios.post("http://localhost:3000/login", {
                email,
                password
            });

            const { access_token, refresh_token , user} = response.data;

            setAuthTokens({
                accessToken: access_token,
                refreshToken: refresh_token
            });

            setCurrentUser(user);
            setUser(user);
            alert("Đăng nhập thành công!");
        } catch (error) {
            const errorMsg = error.response?.data?.error || "Sai email hoặc mật khẩu";
            alert("Lỗi đăng nhập: " + errorMsg);
        }
    };

    // Hàm xử lý Đăng ký
    const handleRegister = async () => {
        if (!email || !password) return alert("Vui lòng nhập đầy đủ thông tin");
        try {
            await axios.post("http://localhost:3000/register", {
                email,
                password
            });
            alert("Đăng ký thành công! Giờ bạn có thể đăng nhập.");
        } catch (error) {
            const errors = error.response?.data?.errors;
            alert("Lỗi đăng ký: " + (errors ? errors.join(", ") : "Email đã tồn tại"));
        }
    };

    return (
        <div style={styles.header}>
            <h2>🏠 Funny Movies</h2>

            <div style={styles.authBox}>
                {user ? (
                    <div style={styles.userSection}>
                        <span>Welcome <b>{user.email}</b></span>
                        <button onClick={() => window.location = "/share"} style={styles.btnShare}>Share a movie</button>
                        <button onClick={onLogout} style={styles.btnLogout}>Logout</button>
                    </div>
                ) : (
                    <div style={styles.loginForm}>
                        <input
                            style={styles.input}
                            placeholder="Email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                        <input
                            style={styles.input}
                            placeholder="Password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                        <button onClick={handleLogin} style={styles.btnLogin}>Login</button>
                        <button onClick={handleRegister} style={styles.btnRegister}>Register</button>
                    </div>
                )}
            </div>
        </div>
    );
}

const styles = {
    header: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "10px 20px",
        borderBottom: "1px solid #ccc"
    },
    authBox: { display: "flex", alignItems: "center" },
    loginForm: { display: "flex", gap: "10px" },
    userSection: { display: "flex", alignItems: "center", gap: "15px" },
    input: { padding: "8px", borderRadius: "4px", border: "1px solid #ddd" },
    btnLogin: { padding: "8px 15px", cursor: "pointer", backgroundColor: "#007bff", color: "#fff", border: "none", borderRadius: "4px" },
    btnRegister: { padding: "8px 15px", cursor: "pointer", backgroundColor: "#28a745", color: "#fff", border: "none", borderRadius: "4px" },
    btnShare: { padding: "8px 15px", cursor: "pointer" },
    btnLogout: { padding: "8px 15px", cursor: "pointer", backgroundColor: "#dc3545", color: "#fff", border: "none", borderRadius: "4px" }
};