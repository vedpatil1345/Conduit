import {create} from "zustand";
import {type User, type UserDetails} from "@/types/user";

interface AuthState {
    authorized: boolean;
    user: User | null;
    userDetails: UserDetails | null;
    setUser: (user: User | null) => void;
    setUserDetails: (userDetails: UserDetails | null) => void;
    setAuthorized: (authorized: boolean) => void;
    isLoading: boolean;
    setIsLoading: (isLoading: boolean) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
    authorized: false,
    user: null,
    userDetails: null,
    setUser: (user) => set({user}),
    setUserDetails: (userDetails) => set({userDetails}),
    setAuthorized: (authorized) => set({authorized}),
    isLoading: true,
    setIsLoading: (isLoading) => set({isLoading}),
}))

export const checkAuth = () => {
    const {user, setAuthorized} = useAuthStore.getState();
    if(user){
        setAuthorized(true);
    }
}