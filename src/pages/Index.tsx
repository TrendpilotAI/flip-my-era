
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

const Index = () => {
  const { toast } = useToast();
  
  const migrateTemplates = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('migrate-email-templates');
      
      if (error) {
        console.error('Error migrating templates:', error);
        toast({
          title: "Error",
          description: "Failed to migrate email templates",
          variant: "destructive",
        });
        return;
      }

      console.log('Templates migrated successfully:', data);
      toast({
        title: "Success",
        description: "Email templates migrated to Brevo",
      });
    } catch (err) {
      console.error('Error:', err);
      toast({
        title: "Error",
        description: "Something went wrong",
        variant: "destructive",
      });
    }
  };
  
  return (
    <div>
      <h1>Welcome to the Index Page</h1>
      <p>This is a basic index page.</p>
      <Button onClick={migrateTemplates}>
        Migrate Email Templates to Brevo
      </Button>
    </div>
  );
};

export default Index;
