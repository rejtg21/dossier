import type { ExpertiseCategory } from "@/data/types";

export const expertiseIntro =
  "Architecture, backend, frontend, data, cloud, and AI — end to end.";

export const categories = [
  {
    title: "Software Architecture & System Design",
    groups: [
      {
        label: "Design experience",
        items: [
          "Scalable SaaS platforms",
          "Multi-tenant architectures",
          "Distributed systems",
          "REST API architectures",
          "Database architectures",
          "Event-driven workflows",
          "Background processing systems",
          "Queue-based architectures",
          "High-availability systems",
          "Security-focused architectures",
          "Cloud infrastructure strategies",
          "CI/CD and deployment strategies",
          "Cost-optimized architectures",
        ],
      },
      {
        label: "Balances technical decisions with",
        items: [
          "Business requirements",
          "Product priorities",
          "Engineering complexity",
          "Operational cost",
          "Long-term maintainability",
        ],
      },
    ],
  },
  {
    title: "Backend Development",
    groups: [
      {
        label: "Primary technologies",
        items: [
          "Laravel / PHP",
          "Node.js",
          "NestJS",
          "Express",
          "TypeScript",
          "Python",
        ],
      },
      {
        label: "Experience building",
        items: [
          "Authentication systems",
          "RBAC and authorization",
          "JWT and cookie-based authentication",
          "OAuth integrations",
          "Payment integrations",
          "API integrations",
          "Webhooks",
          "Background jobs",
          "Queue processing",
          "Notification systems",
          "AI-powered backend services",
        ],
      },
    ],
  },
  {
    title: "Frontend & Mobile Development",
    groups: [
      {
        label: "Technologies",
        items: [
          "React",
          "Next.js",
          "TypeScript",
          "React Native",
          "Expo",
          "Flutter",
          "Tailwind CSS",
        ],
      },
      {
        label: "Experience building",
        items: [
          "Mobile applications (iOS and Android)",
          "Customer-facing applications",
          "Admin dashboards",
          "SaaS portals",
          "CMS-driven websites",
          "Responsive applications",
        ],
      },
      {
        label: "Frontend architecture",
        items: [
          "Server-Side Rendering (SSR)",
          "Static Site Generation (SSG)",
          "Incremental Static Regeneration (ISR)",
          "SEO optimization",
          "Performance optimization",
        ],
      },
    ],
  },
  {
    title: "Database & Data Engineering",
    groups: [
      {
        label: "Technologies",
        items: ["PostgreSQL", "MySQL", "MongoDB", "SQL Server", "Redis"],
      },
      {
        label: "Experience includes",
        items: [
          "Database schema design",
          "Query optimization",
          "Indexing strategies",
          "JSONB usage",
          "Materialized views",
          "Data synchronization",
          "Bidirectional synchronization",
          "Conflict resolution",
          "Offline/online synchronization",
          "Vector search using pgvector",
        ],
      },
    ],
  },
  {
    title: "Cloud Infrastructure & DevOps",
    groups: [
      {
        label: "AWS",
        items: [
          "EC2",
          "ECS",
          "Lambda",
          "RDS",
          "S3",
          "CloudFront",
          "IAM",
          "SES",
          "SQS",
          "API Gateway",
          "AWS Bedrock",
        ],
      },
      {
        label: "Infrastructure & delivery",
        items: [
          "Docker",
          "Terraform",
          "GitHub Actions",
          "CircleCI",
          "GitLab CI",
          "Linux administration",
          "Nginx",
          "Production monitoring",
        ],
      },
      {
        label: "Experience includes",
        items: [
          "Cloud architecture",
          "CI/CD automation",
          "Deployment strategies",
          "Environment management",
          "Infrastructure scaling",
          "Production troubleshooting",
        ],
      },
    ],
  },
  {
    title: "AI Engineering & Automation",
    groups: [
      {
        label: "Platforms",
        items: ["OpenAI", "Claude", "AWS Bedrock", "LangChain"],
      },
      {
        label: "Experience includes",
        items: [
          "RAG architecture",
          "Vector search",
          "Document processing",
          "Prompt engineering",
          "Structured outputs",
          "AI validation workflows",
          "LLM evaluation",
          "AI workflow design",
          "AI-assisted software development",
        ],
      },
      {
        label: "Daily AI-assisted workflow",
        items: ["Claude Code", "ChatGPT", "Gemini"],
      },
    ],
  },
] as const satisfies readonly ExpertiseCategory[];
