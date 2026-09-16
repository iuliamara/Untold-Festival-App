import React, { createContext, useContext, useState } from 'react';

export interface User {
  id: number;
  username: string;
  email: string;
  userType: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (user: User, token: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const storedUser = sessionStorage.getItem('untold_user');
    return storedUser ? JSON.parse(storedUser) : null;
  });
  const [token, setToken] = useState<string | null>(() => {
    return sessionStorage.getItem('untold_token');
  });

  const login = (userData: User, authToken: string) => {
    setUser(userData);
    setToken(authToken);
    sessionStorage.setItem('untold_user', JSON.stringify(userData));
    sessionStorage.setItem('untold_token', authToken);
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    sessionStorage.removeItem('untold_user');
    sessionStorage.removeItem('untold_token');
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
