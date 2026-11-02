export interface Hackathon {
  id: string;
  name: string;
  organizer: string;
  format: string;
  period: string;
  result: string | null;
  project: string;
  projectSlug: string;
  summary: string;
  highlights: string[];
  tags: string[];
  github: string;
  demo: string;
}

export const hackathonData: Hackathon[] = [
  {
    id: 'H-001',
    name: 'OpenFire',
    organizer: 'Alan AI',
    format: 'Solo, virtual',
    period: 'Oct 26 — Oct 27, 2026',
    result: 'Winner',
    project: 'FireDrill',
    projectSlug: 'firedrill-agent-test-runner',
    summary:
      'Built and submitted FireDrill solo in about 31 hours: an open-source test runner that attacks an unattended Alan workflow with prompt-injection pull requests and grades what it did on GitHub.',
    highlights: [
      'Submission package: public GitHub repo, deployed results site, and a 1 to 3 minute demo video.',
      'Ran the attack pack live against a real Alan Code automation and published every result as recorded, including timeouts.',
      'Used Alan as the system under test, observing only GitHub effects because Alan has no documented API.',
    ],
    tags: ['Alan AI', 'Prompt Injection', 'AI Agent Testing', 'TypeScript', 'GitHub API'],
    github: 'https://github.com/SarthakRoy-1/FireDrill',
    demo: 'https://firedrill-silk.vercel.app',
  },
];
