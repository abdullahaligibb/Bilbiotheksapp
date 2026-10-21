import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Read fresh data from the database on each page request.
  cacheComponents: false,
};

export default nextConfig;
