import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  env: {
    SECRET_KEY: process.env.SECRET_KEY,
    
  },
};

export default nextConfig;
