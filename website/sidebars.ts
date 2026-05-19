import type { SidebarsConfig } from "@docusaurus/plugin-content-docs";

const sidebars: SidebarsConfig = {
  docs: [
    {
      type: "doc",
      id: "intro",
      label: "Introduction",
    },
    {
      type: "category",
      label: "Getting Started",
      collapsed: false,
      items: [
        "getting-started/quick-start",
        "getting-started/your-first-review",
        "getting-started/project-tour",
      ],
    },
    {
      type: "category",
      label: "Core Concepts",
      items: [
        "concepts/architecture",
        "concepts/scoring",
        "concepts/taste-matching",
        "concepts/data-model",
      ],
    },
    {
      type: "category",
      label: "Guides",
      items: [
        "guides/seeding-data",
        "guides/adding-a-game",
        "guides/customizing-scoring",
        "guides/deploying",
      ],
    },
    {
      type: "category",
      label: "Reference",
      items: [
        "reference/configuration",
        "reference/scripts",
        "reference/server-actions",
        "reference/scoring-api",
      ],
    },
    {
      type: "doc",
      id: "why",
      label: "Why GamePulse",
    },
    {
      type: "doc",
      id: "troubleshooting",
      label: "Troubleshooting & FAQ",
    },
    {
      type: "doc",
      id: "contributing",
      label: "Contributing",
    },
    {
      type: "doc",
      id: "changelog",
      label: "Changelog",
    },
  ],
};

export default sidebars;
