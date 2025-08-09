// import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';

// interface AuthContextType {
//   user: string | null;
//   token: string | null;
//   login: (username: string, token: string) => void;
//   logout: () => void;
// }


// const AuthContext = createContext<AuthContextType | null>(null);

// export const AuthProvider = ({ children }: { children: ReactNode }) => {
//   const [user, setUser] = useState<string | null>(null);
//   const [token, setToken] = useState<string | null>(null);

//   const login = (username: string, token: string) => {
//     setUser(username);
//     setToken(token);
//     localStorage.setItem("token", token);
//     localStorage.setItem("user", username);
//   };

//   const logout = () => {
//     setUser(null);
//     setToken(null);
//     localStorage.removeItem("token");
//     localStorage.removeItem("user");
//   };

//   useEffect(() => {
//     const savedToken = localStorage.getItem("token");
//     const savedUser = localStorage.getItem("user");
//     if (savedToken && savedUser) {
//       setToken(savedToken);
//       setUser(savedUser); 
//     }
//   }, []);

//   return (
//     <AuthContext.Provider value={{ user, token, login, logout }}>
//       {children}
//     </AuthContext.Provider>
//   );
// };


// export const useAuth = () => {
//   const context = useContext(AuthContext);
//   if (!context) throw new Error('useAuth must be used inside AuthProvider');
//   return context;
// };


import React, {
  createContext,
  useContext,
  useState,
  ReactNode,
  useEffect,
} from "react";

// User type definition
export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: "referee" | "applicant";
}

// Context type definition
interface AuthContextType {
  user: User | null;
  loading: boolean;
  token: string | null;
  login: (user: User, token: string) => void;
  logout: () => void;
}

// Create the context
const AuthContext = createContext<AuthContextType | null>(null);

// Provider
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Login method
  const login = (user: User, token: string) => {
    setUser(user);
    setToken(token);
    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(user));
  };

  // Logout method
  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem("token");
    localStorage.removeItem("user");
  };

  // On page load, restore auth state from localStorage
  useEffect(() => {
    const savedToken = localStorage.getItem("token");
    const savedUser = localStorage.getItem("user");
    if (savedToken && savedUser) {
      try {
        setToken(savedToken);
        setUser(JSON.parse(savedUser));
      } catch (err) {
        console.error("Failed to parse user from localStorage", err);
        logout(); // fallback
      }
    }
    setLoading(false);
  }, []);

  return (
    <AuthContext.Provider value={{ user, token, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

// Hook for easy usage
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside AuthProvider");
  return context;
};