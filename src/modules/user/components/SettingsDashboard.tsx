
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from '@/modules/shared/components/ui/button';
import { Separator } from '@/modules/shared/components/ui/separator';
import { ArrowLeft, User, BookOpen, CreditCard } from "lucide-react";
import { supabase } from "@/core/integrations/supabase/client";

type SettingsSection = "profile" | "stories" | "billing";

const SettingsDashboard = () => {
  const [activeSection, setActiveSection] = useState<SettingsSection>("profile");
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-400 via-pink-500 to-red-500 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        <Button
          variant="ghost"
          className="mb-6 text-white hover:bg-white/20"
          onClick={() => navigate('/')}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Stories
        </Button>

        <div className="bg-white/95 backdrop-blur-lg rounded-2xl p-8">
          <div className="flex flex-col md:flex-row gap-8">
            {/* Sidebar Navigation */}
            <div className="w-full md:w-64 space-y-1">
              <h2 className="text-lg font-semibold mb-4 text-gray-900">Settings</h2>
              <Button
                variant={activeSection === "profile" ? "default" : "ghost"}
                className="w-full justify-start"
                onClick={() => setActiveSection("profile")}
              >
                <User className="h-4 w-4 mr-2" />
                Profile
              </Button>
              <Button
                variant={activeSection === "stories" ? "default" : "ghost"}
                className="w-full justify-start"
                onClick={() => setActiveSection("stories")}
              >
                <BookOpen className="h-4 w-4 mr-2" />
                Stories
              </Button>
              <Button
                variant={activeSection === "billing" ? "default" : "ghost"}
                className="w-full justify-start"
                onClick={() => setActiveSection("billing")}
              >
                <CreditCard className="h-4 w-4 mr-2" />
                Plan & Billing
              </Button>
            </div>

            <Separator orientation="vertical" className="hidden md:block" />

            {/* Content Area */}
            <div className="flex-1 min-h-[400px]">
              {activeSection === "profile" && (
                <div className="space-y-6">
                  <h3 className="text-2xl font-semibold text-gray-900">Profile Settings</h3>
                  <p className="text-gray-600">Profile settings coming soon...</p>
                </div>
              )}
              {activeSection === "stories" && (
                <div className="space-y-6">
                  <h3 className="text-2xl font-semibold text-gray-900">Story Settings</h3>
                  <p className="text-gray-600">Story settings coming soon...</p>
                </div>
              )}
              {activeSection === "billing" && (
                <div className="space-y-6 w-full">
                  <h3 className="text-2xl font-semibold text-gray-900">Plan & Billing</h3>
                  <div className="w-full">
                    <Button
                      onClick={async () => {
                        try {
                          const { data, error } = await supabase.functions.invoke('stripe-portal', {
                            method: 'POST',
                          });
                          if (error || !data?.url) throw new Error('Failed to open billing portal');
                          window.location.href = data.url;
                        } catch {
                          console.error('Failed to open Stripe billing portal');
                        }
                      }}
                      className="bg-purple-600 hover:bg-purple-700 text-white"
                    >
                      Manage Billing
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsDashboard;
