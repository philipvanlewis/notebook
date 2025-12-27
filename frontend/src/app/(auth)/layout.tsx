import { BookOpen } from "lucide-react";
import Link from "next/link";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex">
      {/* Left side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary/10 via-primary/5 to-background items-center justify-center p-12">
        <div className="max-w-md space-y-6">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <BookOpen className="h-6 w-6 text-primary" />
            </div>
            <span className="text-3xl font-bold">Notebook</span>
          </div>
          <h1 className="text-4xl font-bold leading-tight">
            Your personal knowledge base, powered by AI
          </h1>
          <p className="text-lg text-muted-foreground">
            Capture thoughts, connect ideas, and discover insights with intelligent note-taking that understands your content.
          </p>
          <div className="space-y-4 pt-4">
            <Feature text="Smart semantic search across all your notes" />
            <Feature text="AI-powered chat to explore your knowledge" />
            <Feature text="Beautiful knowledge graph visualization" />
            <Feature text="Daily journaling with AI prompts" />
          </div>
        </div>
      </div>

      {/* Right side - Auth form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          {/* Mobile branding */}
          <div className="lg:hidden mb-8 text-center">
            <Link href="/" className="inline-flex items-center gap-2">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <BookOpen className="h-5 w-5 text-primary" />
              </div>
              <span className="text-2xl font-bold">Notebook</span>
            </Link>
          </div>

          {children}
        </div>
      </div>
    </div>
  );
}

function Feature({ text }: { text: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="h-2 w-2 rounded-full bg-primary" />
      <span className="text-muted-foreground">{text}</span>
    </div>
  );
}
