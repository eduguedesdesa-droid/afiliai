import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // O indicador de dev (o overlay "nextjs-portal") fica sobre a página e
  // intercepta cliques automatizados — desligado só quando rodando a suíte
  // de E2E (playwright.config.ts define essa env var só pro servidor dele,
  // nunca em `pnpm dev` normal).
  ...(process.env.E2E_TESTING === "1" ? { devIndicators: false } : {}),
};

export default nextConfig;
