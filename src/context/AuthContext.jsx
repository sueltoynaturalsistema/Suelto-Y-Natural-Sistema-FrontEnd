import { createContext, useContext, useEffect, useState, useCallback } from "react";
import client from "../api/client";

export const AuthContext = createContext(null);

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [token, setToken] = useState(() => localStorage.getItem("token"));
    const [user, setUser] = useState(() => {
        try {
            const raw = localStorage.getItem("user");
            return raw ? JSON.parse(raw) : null;
        } catch {
            localStorage.removeItem("token");
            localStorage.removeItem("user");
            return null;
        }
    });
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        setIsLoading(false);
    }, []);

    const clearSession = useCallback(() => {
        setToken(null);
        setUser(null);
    }, []);

    const login = async (email, password) => {
        const { data } = await client.post("auth/login", { email, password });
        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(data.user));
        setToken(data.token);
        setUser(data.user);
        return data;
    };

    const logout = useCallback(() => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        clearSession();
    }, [clearSession]);

    useEffect(() => {
        const onStorage = (e) => {
            if (e.key === "token" && !e.newValue) {
                clearSession();
            }
        };
        const onAuthLogout = () => clearSession();
        window.addEventListener("storage", onStorage);
        window.addEventListener("auth:logout", onAuthLogout);
        return () => {
            window.removeEventListener("storage", onStorage);
            window.removeEventListener("auth:logout", onAuthLogout);
        };
    }, [clearSession]);

    const value = {
        user,
        token,
        isAuthenticated: !!token,
        isLoading,
        login,
        logout,
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};
