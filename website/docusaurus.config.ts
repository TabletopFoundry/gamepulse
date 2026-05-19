import { themes as prismThemes } from "prism-react-renderer";
import type { Config } from "@docusaurus/types";
import type * as Preset from "@docusaurus/preset-classic";

const config: Config = {
  title: "GamePulse",
  tagline:
    "A Rotten Tomatoes-style aggregator for board games — critic consensus, community reviews, and personalized taste matching in one place.",
  favicon: "img/favicon.svg",

  future: {
    v4: true,
  },

  url: "https://tabletopfoundry.github.io",
  baseUrl: "/gamepulse/",

  organizationName: "TabletopFoundry",
  projectName: "gamepulse",

  onBrokenLinks: "throw",

  i18n: {
    defaultLocale: "en",
    locales: ["en"],
  },

  presets: [
    [
      "classic",
      {
        docs: {
          sidebarPath: "./sidebars.ts",
          editUrl:
            "https://github.com/TabletopFoundry/gamepulse/edit/main/website/",
          routeBasePath: "/",
        },
        blog: false,
        theme: {
          customCss: "./src/css/custom.css",
        },
      } satisfies Preset.Options,
    ],
  ],

  plugins: [
    [
      require.resolve("@easyops-cn/docusaurus-search-local"),
      {
        hashed: true,
        indexBlog: false,
        docsRouteBasePath: "/",
        highlightSearchTermsOnTargetPage: true,
        explicitSearchResultPath: true,
      },
    ],
  ],

  markdown: {
    mermaid: true,
    hooks: {
      onBrokenMarkdownLinks: "warn",
    },
  },

  themes: ["@docusaurus/theme-mermaid"],

  themeConfig: {
    image: "img/gamepulse-social.svg",
    metadata: [
      {
        name: "keywords",
        content:
          "board games, review aggregator, critic scores, taste matching, board game reviews, GamePulse",
      },
      {
        name: "og:type",
        content: "website",
      },
    ],
    colorMode: {
      defaultMode: "dark",
      respectPrefersColorScheme: true,
    },
    navbar: {
      title: "GamePulse",
      logo: {
        alt: "GamePulse logo",
        src: "img/logo.svg",
      },
      items: [
        {
          to: "/getting-started/quick-start",
          label: "Get Started",
          position: "left",
        },
        {
          to: "/concepts/architecture",
          label: "Concepts",
          position: "left",
        },
        {
          to: "/guides/seeding-data",
          label: "Guides",
          position: "left",
        },
        {
          to: "/reference/configuration",
          label: "Reference",
          position: "left",
        },
        {
          to: "/why",
          label: "Why GamePulse",
          position: "left",
        },
        {
          href: "https://github.com/TabletopFoundry/gamepulse",
          label: "GitHub",
          position: "right",
        },
      ],
    },
    footer: {
      style: "dark",
      links: [
        {
          title: "Docs",
          items: [
            { label: "Quick Start", to: "/getting-started/quick-start" },
            { label: "Architecture", to: "/concepts/architecture" },
            { label: "Scoring Model", to: "/concepts/scoring" },
            { label: "Configuration", to: "/reference/configuration" },
          ],
        },
        {
          title: "Project",
          items: [
            { label: "Why GamePulse", to: "/why" },
            { label: "Troubleshooting", to: "/troubleshooting" },
            { label: "Changelog", to: "/changelog" },
            { label: "Contributing", to: "/contributing" },
          ],
        },
        {
          title: "Community",
          items: [
            {
              label: "GitHub",
              href: "https://github.com/TabletopFoundry/gamepulse",
            },
            {
              label: "Discussions",
              href: "https://github.com/TabletopFoundry/gamepulse/discussions",
            },
            {
              label: "Issues",
              href: "https://github.com/TabletopFoundry/gamepulse/issues",
            },
          ],
        },
      ],
      copyright: `Copyright © ${new Date().getFullYear()} GamePulse. MIT Licensed. Built with Docusaurus.`,
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
      additionalLanguages: ["bash", "json", "sql", "typescript", "tsx"],
    },
    mermaid: {
      theme: { light: "neutral", dark: "dark" },
    },
  } satisfies Preset.ThemeConfig,
};

export default config;
