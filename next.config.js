// Import the required modules
const { withSentryConfig } = require("@sentry/nextjs");
const withSvgr = require('next-svgr');

// Your base Next.js configuration
const nextConfig = {
  output: "standalone",
  reactStrictMode: false,
  images: {
    domains: ["pbs.twimg.com", "cdn.helius-rpc.com"],
  },
};

// Sentry plugin options
const sentryWebpackPluginOptions = {
  enabled: true,
  silent: true,
  org: "mixtape-d5",
  project: "javascript-nextjs-kp",
  url: "https://legends.sentry.io",
  authToken: process.env.SENTRY_AUTH_TOKEN,
};

// Compose both withSentryConfig and withSvgr
module.exports = withSvgr(withSentryConfig(nextConfig, sentryWebpackPluginOptions));