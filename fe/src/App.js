import React, { useState, useEffect } from "react";
import apiClient from "./lib/apiClient";
import Home from "./pages/Home";
import Share from "./pages/Share";
import Header from "./components/Header";
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { disconnectCable } from "./lib/actionCableClient";
import NotificationSubscriber from "./components/NotificationSubscriber";
import {
    getAccessToken,
    getCurrentUser,
    setCurrentUser,
    clearAuthStorage
} from "./lib/authStorage";

function App() {

    const [user, setUser] = useState(() => getCurrentUser());

    const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);


    useEffect(() => {
        const verifyUser = async () => {
            const token = getAccessToken();
            if (!token) return;

            try {
                // Gọi API /me để lấy dữ liệu thật từ database
                const res = await apiClient.get("/me")

                setUser(res.data.user);
                setCurrentUser(res.data.user);
            } catch (error) {
                console.error("Token invalid or expired");
                // Nếu token hết hạn hoặc fake, xóa sạch session
                clearAuthStorage();
                setUser(null);
            }
        };

        verifyUser();
    }, []);

    const onLogoutRequested = () => setShowLogoutConfirm(true);

    const handleLogoutAction = async (allDevices) => {
        const token = getAccessToken();
        try {
            if (token) {
                await apiClient.post("/logout", { current_logout: !allDevices });
            }
        } catch (e) {
            console.error("API Logout error", e);
        } finally {
            disconnectCable();
            clearAuthStorage();
            setUser(null);
            setShowLogoutConfirm(false);
            window.location = "/";
        }
    };

    const path = window.location.pathname;

    return (
        <div>
            <Header user={user} onLogout={onLogoutRequested} setUser={setUser} />

            <ToastContainer position="top-right" autoClose={5000} />

            <NotificationSubscriber user={user} />

            {showLogoutConfirm && (
                <div style={modalStyles.overlay}>
                    <div style={modalStyles.modal}>
                        <h3>Đăng xuất?</h3>
                        <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                            <button onClick={() => handleLogoutAction(false)}>Chỉ máy này</button>
                            <button onClick={() => handleLogoutAction(true)}>Tất cả các máy</button>
                            <button onClick={() => setShowLogoutConfirm(false)}>Hủy</button>
                        </div>
                    </div>
                </div>
            )}

            {path === "/share" ? <Share /> : <Home user={user} />}
        </div>
    );
}

const modalStyles = {
    overlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 },
    modal: { backgroundColor: '#fff', padding: '20px', borderRadius: '8px', textAlign: 'center' }
};

export default App;