import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useClerk } from "@clerk/clerk-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/modules/shared/components/ui/card';
import { Button } from '@/modules/shared/components/ui/button';
import { useToast } from '@/modules/shared/hooks/use-toast';
import { Lock } from "lucide-react";

const ResetPassword = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const clerk = useClerk();

  useEffect(() => {
    // Redirect to Clerk's password reset page
    clerk.openSignIn({
      afterSignInUrl: "/",
      afterSignUpUrl: "/",
      initialValues: {
        emailAddress: "",
      },
      appearance: {
        elements: {
          formButtonPrimary: "bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700",
          card: "shadow-none",
        }
      }
    });
  }, [clerk]);

  return (
    <div className="container max-w-md mx-auto py-16">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl flex items-center gap-2">
            <Lock className="h-6 w-6" />
            Password Reset
          </CardTitle>
          <CardDescription>
            Redirecting you to the password reset page...
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading password reset...</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ResetPassword; 