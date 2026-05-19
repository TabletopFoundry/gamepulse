import { JSX, useState } from "react";
import Layout from "@theme/Layout";
import Link from "@docusaurus/Link";
import useDocusaurusContext from "@docusaurus/useDocusaurusContext";

type Feature = {
  icon: string;
  title: string;
  description: string;
};

const FEATURES: Feature[] = [
  {
    icon: "🎯",
    title: "Dual GamePulse scores",
    description:
      "Critic and community scores side by side, with a consensus badge that captures whether a game is acclaimed, divisive, or a hidden gem.",
  },
  {
    icon: "🧮",
    title: "Taste-matched predictions",
    description:
      "Cosine similarity plus Pearson correlation across six taste dimensions surface critics who actually share your taste.",
  },
  {
    icon: "📰",
    title: "Personalized content feed",
    description:
      "Reviews, news, deals, videos, and a release calendar — filtered by the critics and categories you follow.",
  },
  {
    icon: "💾",
    title: "Zero-config local stack",
    description:
      "SQLite via better-sqlite3 with deterministic seeds. Clone, run `npm run dev`, and you have a populated catalog in under 30 seconds.",
  },
  {
    icon: "🧱",
    title: "Server components first",
    description:
      "Built on Next.js 16 with the App Router, React 19 server components, server actions, and `useActionState` — no client-side data fetching plumbing.",
  },
  {
    icon: "🎨",
    title: "Production-quality UI",
    description:
      "Tailwind CSS 4 design system with rose-accented cards, Recharts radar visualizations, and accessible toast feedback.",
  },
];

const STATS = [
  { number: "60+", label: "Seeded games" },
  { number: "14", label: "Named critics" },
  { number: "200+", label: "Critic reviews" },
  { number: "6", label: "Taste dimensions" },
];

function CopyableInstall(): JSX.Element {
  const [copied, setCopied] = useState(false);
  const command = "git clone https://github.com/TabletopFoundry/gamepulse.git && cd gamepulse && npm install && npm run dev";

  function onCopy() {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(command);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    }
  }

  return (
    <button className="hero-install" onClick={onCopy} type="button" aria-label="Copy install command">
      <span className="prompt">$</span>
      <span>npx degit TabletopFoundry/gamepulse gamepulse &amp;&amp; cd gamepulse &amp;&amp; npm i &amp;&amp; npm run dev</span>
      <span className="copy-hint">{copied ? "copied ✓" : "click to copy"}</span>
    </button>
  );
}

export default function Home(): JSX.Element {
  const { siteConfig } = useDocusaurusContext();
  return (
    <Layout
      title={siteConfig.title}
      description="Critic consensus scores, community reviews, and personalized taste matching for board games."
    >
      <header className="hero-gradient">
        <span className="hero-eyebrow">🎲 v0.1 · Open source · MIT</span>
        <h1>The board-game review aggregator you wish existed.</h1>
        <p className="hero-subtitle">
          GamePulse is a self-hosted, full-stack Next.js app that aggregates critic and community scores,
          surfaces consensus badges, and predicts how much you&apos;ll love a game using taste-matched critics.
        </p>
        <div className="hero-ctas">
          <Link className="button button--primary button--lg" to="/getting-started/quick-start">
            Get Started · 5 min
          </Link>
          <Link
            className="button button--secondary button--lg"
            to="https://github.com/TabletopFoundry/gamepulse"
          >
            View on GitHub
          </Link>
        </div>
        <CopyableInstall />
        <div className="stat-row">
          {STATS.map((stat) => (
            <div key={stat.label} className="stat-card">
              <div className="stat-number">{stat.number}</div>
              <div className="stat-label">{stat.label}</div>
            </div>
          ))}
        </div>
      </header>

      <section>
        <div className="section-heading">
          <h2>Everything in one place</h2>
          <p>
            Critic aggregation, community pulse, and personalized prediction — engineered as a single,
            inspectable codebase you can run locally in seconds.
          </p>
        </div>
        <div className="feature-grid">
          {FEATURES.map((feature) => (
            <div key={feature.title} className="feature-card">
              <div className="icon" aria-hidden>
                {feature.icon}
              </div>
              <h3>{feature.title}</h3>
              <p>{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      <section>
        <div className="section-heading">
          <h2>How it&apos;s wired</h2>
          <p>
            Pages call typed query modules. Query modules call SQLite directly. Scoring and taste math
            live in dedicated, pure libraries. No microservices. No external API keys.
          </p>
        </div>
        <div className="code-callout">
          <pre style={{
            background: "var(--ifm-background-surface-color)",
            border: "1px solid rgba(148, 163, 184, 0.18)",
            borderRadius: "16px",
            padding: "1.5rem",
            lineHeight: 1.5,
            fontSize: "0.9rem",
            overflowX: "auto",
          }}>{`  ┌────────────────────────────────────────────────────┐
  │  app/  ·  Next.js 16 App Router (server components) │
  └─────────────────────┬──────────────────────────────┘
                        ▼
  ┌────────────────────────────────────────────────────┐
  │  lib/queries/  ·  Typed data access per domain      │
  │  games · critics · feed · dashboard · user          │
  └─────────────────────┬──────────────────────────────┘
                        ▼
  ┌────────────────────────────────────────────────────┐
  │  lib/scoring.ts  +  lib/taste.ts                    │
  │  Cosine similarity · Pearson correlation · badges   │
  └─────────────────────┬──────────────────────────────┘
                        ▼
  ┌────────────────────────────────────────────────────┐
  │  lib/db/  ·  better-sqlite3  ·  data/gamepulse.db   │
  └────────────────────────────────────────────────────┘`}</pre>
        </div>
        <div className="section-heading" style={{ marginTop: "0" }}>
          <Link className="button button--primary button--lg" to="/concepts/architecture">
            Explore the architecture →
          </Link>
        </div>
      </section>

      <div style={{ height: "5rem" }} />
    </Layout>
  );
}
