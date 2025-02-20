
import { Link } from "react-router-dom";
import { Settings as SettingsIcon } from "lucide-react";

export const Layout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="relative min-h-screen">
      <nav className="absolute top-4 right-4 z-50">
        <Link
          to="/settings"
          className="p-2 bg-white/20 backdrop-blur-lg rounded-full hover:bg-white/30 transition-colors"
          title="Settings"
        >
          <SettingsIcon className="w-6 h-6 text-white" />
        </Link>
      </nav>
      {children}
    </div>
  );
};
