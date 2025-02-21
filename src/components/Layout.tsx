
import { Link } from "react-router-dom";
import { BookOpen, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Layout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="min-h-screen">
      <nav className="fixed top-0 right-0 p-4 z-50 flex gap-2">
        <Link to="/stories">
          <Button variant="outline" size="icon" className="bg-white/80 backdrop-blur-sm">
            <BookOpen className="h-5 w-5" />
          </Button>
        </Link>
        <Link to="/settings">
          <Button variant="outline" size="icon" className="bg-white/80 backdrop-blur-sm">
            <Settings className="h-5 w-5" />
          </Button>
        </Link>
      </nav>
      {children}
    </div>
  );
};
