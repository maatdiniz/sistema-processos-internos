import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';

interface Usuario {
    id: number;
    matricula: string;
    nome: string;
    perfil: string;
    departamento_id: number;
}

interface AuthContextData {
    usuario: Usuario | null;
    token: string | null;
    login: (token: string, usuario: Usuario) => void;
    logout: () => void;
}

const AuthContext = createContext<AuthContextData>({} as AuthContextData);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [usuario, setUsuario] = useState<Usuario | null>(null);
    const [token, setToken] = useState<string | null>(null);

    useEffect(() => {
        const storedToken = localStorage.getItem('@CEAD:token');
        const storedUsuario = localStorage.getItem('@CEAD:usuario');

        if (storedToken && storedUsuario) {
            setToken(storedToken);
            setUsuario(JSON.parse(storedUsuario));
        }
    }, []);

    const login = (newToken: string, novoUsuario: Usuario) => {
        localStorage.setItem('@CEAD:token', newToken);
        localStorage.setItem('@CEAD:usuario', JSON.stringify(novoUsuario));
        setToken(newToken);
        setUsuario(novoUsuario);
    };

    const logout = () => {
        localStorage.removeItem('@CEAD:token');
        localStorage.removeItem('@CEAD:usuario');
        setToken(null);
        setUsuario(null);
    };

    return (
        <AuthContext.Provider value={{ usuario, token, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    return useContext(AuthContext);
}
