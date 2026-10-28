import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Projects · Sam Catania",
  description: "Side projects by Sam Catania",
};

const projects = [
  {
    name: "Booth",
    href: "https://booth.sbc.me",
    description: "Learn to DJ in the browser: lessons, drills, two decks and a mashup lab.",
  },
  {
    name: "Hive",
    href: "https://hive.sbc.me",
    description: "The board game Hive: play the computer, pass-and-play, or online with a friend.",
  },
  {
    name: "Mood check-in",
    href: "https://mood.sbc.me",
    description: "A moment to notice how you feel.",
  },
];

export default function Projects() {
  return (
    <main className="bio-page flex min-h-screen items-center justify-center px-6 font-mono bg-background text-foreground">
      <div className="w-full max-w-xl space-y-6">
        <h1 className="text-lg font-medium">Projects</h1>
        <ul className="space-y-4 text-sm leading-relaxed">
          {projects.map((project) => (
            <li key={project.href}>
              <a
                href={project.href}
                className="text-foreground underline underline-offset-2 hover:text-muted-foreground transition-colors"
              >
                {project.name}
              </a>
              <p className="text-muted-foreground">{project.description}</p>
            </li>
          ))}
        </ul>
        <Link
          href="/"
          className="inline-block text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          ← Sam Catania
        </Link>
      </div>
    </main>
  );
}
