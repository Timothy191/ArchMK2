/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@repo/ui", "@repo/supabase", "@repo/database"],
};

export default nextConfig;
