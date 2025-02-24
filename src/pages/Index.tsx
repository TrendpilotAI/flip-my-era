
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";
import { Loader2 } from "lucide-react";

const Index = () => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  
  const migrateTemplates = async () => {
    setIsLoading(true);
    try {
      console.log('Starting template migration...');
      
      const { data, error } = await supabase.functions.invoke('migrate-email-templates', {
        body: { timestamp: new Date().toISOString() }
      });
      
      console.log('Migration response:', { data, error });
      
      if (error) {
        console.error('Error migrating templates:', error);
        toast({
          title: "Error",
          description: `Failed to migrate email templates: ${error.message}`,
          variant: "destructive",
        });
        return;
      }

      console.log('Templates migrated successfully:', data);
      toast({
        title: "Success",
        description: "Email templates migrated to Mailgun",
      });
    } catch (err: any) {
      console.error('Caught error:', err);
      toast({
        title: "Error",
        description: err?.message || "Something went wrong",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="min-h-screen bg-gradient-to-r from-purple-400 via-pink-500 to-red-500 flex flex-col items-center justify-center p-4">
      <div className="bg-white/95 backdrop-blur-lg p-8 rounded-xl shadow-xl max-w-md w-full space-y-6">
        <h1 className="text-3xl font-bold text-gray-900 text-center">Welcome to FlipMyEra</h1>
        <p className="text-gray-600 text-center">
          Your personalized journey starts here. Set up your email templates to get started.
        </p>
        <Button 
          onClick={migrateTemplates}
          disabled={isLoading}
          className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Migrating Templates...
            </>
          ) : (
            "Migrate Email Templates to Mailgun"
          )}
        </Button>
      </div>
    </div>
  );
};

export default Index;
