import { Link, useLocation } from "react-router-dom";
import { Button } from '@/modules/shared/components/ui/button';
import { 
  LayoutDashboard, 
  Key, 
  Users, 
  BarChart3, 
  FileText, 
  Settings, 
  Shield,
  Coins
} from "lucide-react";

const AdminNav = () => {
  const location = useLocation();

  const navItems = [
    {
      path: "/admin",
      label: "Dashboard",
      icon: LayoutDashboard
    },
    {
      path: "/admin/integrations",
      label: "Integrations",
      icon: Key
    },
    {
      path: "/admin/users",
      label: "Users",
      icon: Users
    },
    {
      path: "/admin/credits",
      label: "Credits",
      icon: Coins
    },
    {
      path: "/admin/analytics",
      label: "Analytics",
      icon: BarChart3
    },
    {
      path: "/admin/content",
      label: "Content",
      icon: FileText,
      disabled: true
    },
    {
      path: "/admin/settings",
      label: "Settings",
      icon: Settings,
      disabled: true
    },
    {
      path: "/admin/security",
      label: "Security",
      icon: Shield,
      disabled: true
    }
  ];

  return (
    <div className="bg-white border-b">
      <div className="container max-w-7xl mx-auto px-4">
        <nav className="flex space-x-1 overflow-x-auto">
          {navItems.map((item) => {
            const IconComponent = item.icon;
            const isActive = location.pathname === item.path;
            const isDisabled = item.disabled;
            
            return (
              <Button
                key={item.path}
                variant={isActive ? "default" : "ghost"}
                size="sm"
                className={`whitespace-nowrap ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                disabled={isDisabled}
                asChild={!isDisabled}
              >
                {!isDisabled ? (
                  <Link to={item.path} className="flex items-center gap-2">
                    <IconComponent className="h-4 w-4" />
                    {item.label}
                  </Link>
                ) : (
                  <span className="flex items-center gap-2">
                    <IconComponent className="h-4 w-4" />
                    {item.label}
                  </span>
                )}
              </Button>
            );
          })}
        </nav>
      </div>
    </div>
  );
};

export default AdminNav; 