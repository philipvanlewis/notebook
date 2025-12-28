import Link from "next/link";

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background">
      <div className="container flex flex-col items-center justify-center gap-8 px-4 py-16">
        {/* Logo/Brand */}
        <div className="flex flex-col items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-8 w-8"
            >
              <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" />
            </svg>
          </div>
          <h1 className="text-4xl font-bold tracking-tight text-balance text-center">
            Notebook
          </h1>
        </div>

        {/* Tagline */}
        <p className="max-w-lg text-center text-lg text-muted-foreground text-balance">
          AI-powered personal knowledge management. Capture thoughts, connect
          ideas, and let AI help you discover insights.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-4">
          <Link
            href="/notes"
            className="inline-flex h-11 items-center justify-center rounded-lg bg-primary px-8 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 focus-ring"
          >
            Open App
          </Link>
          <Link
            href="/login"
            className="inline-flex h-11 items-center justify-center rounded-lg border border-input bg-background px-8 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus-ring"
          >
            Sign In
          </Link>
        </div>

        {/* Feature highlights */}
        <div className="mt-12 grid gap-6 sm:grid-cols-3 max-w-3xl">
          <div className="flex flex-col items-center gap-2 text-center p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary text-secondary-foreground">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-5 w-5"
              >
                <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
              </svg>
            </div>
            <h3 className="font-semibold">Capture Instantly</h3>
            <p className="text-sm text-muted-foreground">
              Quick capture with keyboard shortcuts. Never lose a thought.
            </p>
          </div>

          <div className="flex flex-col items-center gap-2 text-center p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary text-secondary-foreground">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-5 w-5"
              >
                <circle cx="12" cy="12" r="10" />
                <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" />
                <path d="M2 12h20" />
              </svg>
            </div>
            <h3 className="font-semibold">Connect Ideas</h3>
            <p className="text-sm text-muted-foreground">
              Bi-directional linking creates a knowledge graph of your thoughts.
            </p>
          </div>

          <div className="flex flex-col items-center gap-2 text-center p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary text-secondary-foreground">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-5 w-5"
              >
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
            </div>
            <h3 className="font-semibold">AI Insights</h3>
            <p className="text-sm text-muted-foreground">
              Chat with your notes. AI helps you find connections and generate
              ideas.
            </p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="w-full border-t py-6">
        <div className="container flex flex-col sm:flex-row items-center justify-between gap-4 px-4">
          <p className="text-sm text-muted-foreground">
            Built with Next.js, Tailwind CSS, and FastAPI
          </p>
          <div className="flex items-center gap-4">
            <Link
              href="/privacy"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Privacy
            </Link>
            <Link
              href="/terms"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Terms
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
