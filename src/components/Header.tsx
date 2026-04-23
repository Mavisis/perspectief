import { Link } from "react-router-dom";
import { Search } from "lucide-react";

export function Header() {
  return (
    <header className="border-b border-divider bg-card">
      <div className="container flex items-center justify-between py-4">
        <Link to="/" className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded bg-primary">
            <span className="font-headline text-lg font-bold text-primary-foreground">P</span>
          </div>
          <div>
            <h1 className="font-headline text-xl font-bold leading-none tracking-tight">
              Perspectief
            </h1>
            <p className="text-xs text-caption font-body">Nieuws vanuit elk perspectief</p>
          </div>
        </Link>

        <nav className="flex items-center gap-6 font-body text-sm font-medium">
          <Link
            to="/"
            className="text-muted-foreground transition-colors hover:text-foreground"
          >
            Gebeurtenissen
          </Link>
          <Link
            to="/transparantie"
            className="text-muted-foreground transition-colors hover:text-foreground"
          >
            Transparantie
          </Link>
          <Link
            to="/"
            className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary text-muted-foreground transition-colors hover:text-foreground"
          >
            <Search className="h-4 w-4" />
          </Link>
        </nav>
      </div>
    </header>
  );
}
