import Link from "next/link";

export default function Home() {
  return (
    <main className="bio-page flex min-h-screen items-center justify-center px-6 font-mono bg-background text-foreground">
      <div className="max-w-xl space-y-6">
        <h1 className="text-lg font-medium">Sam Catania</h1>
        <div className="space-y-4 text-sm leading-relaxed text-muted-foreground">
          <p>
            I work on product at{" "}
            <a
              href="https://www.notion.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-foreground underline underline-offset-2 hover:text-muted-foreground transition-colors"
            >
              Notion
            </a>
            . Before that, I studied Symbolic Systems at Stanford and edited{" "}
            <a
              href="https://stanforddaily.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-foreground underline underline-offset-2 hover:text-muted-foreground transition-colors"
            >
              The Stanford Daily
            </a>
            .
          </p>
          <p>
            I like thinking in systems, helping other people do that, and making
            charcuterie boards. And plenty of other things.
          </p>
          <p>I live in San Francisco and grew up in Philadelphia.</p>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <a
            href="https://x.com/sbcatania"
            target="_blank"
            rel="noopener noreferrer"
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            twitter
          </a>
          <span className="text-muted-foreground/50">{"\u30FB"}</span>
          <a
            href="https://linkedin.com/in/samuelcatania"
            target="_blank"
            rel="noopener noreferrer"
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            linkedin
          </a>
          <span className="text-muted-foreground/50">{"\u30FB"}</span>
          <a
            href="https://substack.com/@samcat?utm_campaign=profile&utm_medium=profile-page"
            target="_blank"
            rel="noopener noreferrer"
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            substack
          </a>
        </div>
      </div>
    </main>
  );
}
