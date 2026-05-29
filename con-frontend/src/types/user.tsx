export interface User {
    id: number;
    userName: string;
    companyId:number;
    email: string;
    token: string;
    photoUrl?: string;
}
export interface UserDetails {
    id: number;
    userName: string;
    companyId:number;
    email: string;
    photoUrl?: string;
    githubUsername?: string;
    gitLabUsername?: string;
    bio?: string;
    phoneNumber?: string;
}