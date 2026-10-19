import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // The setup check must read the database on every request.
  cacheComponents: false,
};

export default nextConfig;
