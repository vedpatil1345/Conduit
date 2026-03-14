import {create} from "zustand";
import {type User, type UserDetails} from "@/types/user";

export const useAuthStore = create((set) => ({
    user: null,
    userDetails:null,
    setUser: (user:User) => set({user}),
    setUserDetails: (userDetails:UserDetails) => set({userDetails}),
}))
