import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { Button } from '@/modules/shared/components/ui/button';
import { Card, CardContent } from '@/modules/shared/components/ui/card';
import { ArrowLeft, Home, BookOpen, Sparkles, User, HelpCircle, FileText } from "lucide-react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    // Log the 404 error for analytics purposes
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
    
    // Set proper page title for SEO
    document.title = "404 - Page Not Found | Flip My Era";
    
    // You could also send this to an error tracking service
    // Example: trackEvent('404_error', { path: location.pathname });
  }, [location.pathname]);

  // Check if this is an ebook or story specific 404
  const isEbookNotFound = location.pathname.startsWith('/ebook/');
  const isStoryNotFound = location.pathname.startsWith('/story/');
  const isContentNotFound = isEbookNotFound || isStoryNotFound;

  const getContentSpecificMessage = () => {
    if (isEbookNotFound) {
      return {
        title: "Ebook Not Found",
        description: "The ebook you're looking for doesn't exist or you don't have permission to view it. It may have been deleted or the link might be incorrect.",
        icon: <BookOpen className="h-12 w-12 mx-auto text-purple-400 mb-4" />
      };
    }
    if (isStoryNotFound) {
      return {
        title: "Story Not Found", 
        description: "The story you're looking for doesn't exist or you don't have permission to view it. It may have been deleted or the link might be incorrect.",
        icon: <FileText className="h-12 w-12 mx-auto text-purple-400 mb-4" />
      };
    }
    return {
      title: "Page Not Found",
      description: "The page you're looking for doesn't exist or has been moved. Let's get you back on track with your storytelling journey!",
      icon: null
    };
  };

  const contentMessage = getContentSpecificMessage();

  const popularPages = [
    {
      title: "Create Stories",
      description: "Generate your alternate timeline stories",
      href: "/",
      icon: <Sparkles className="h-5 w-5" />
    },
    {
      title: "Past Generations",
      description: "View your previous stories and ebooks",
      href: "/past-generations",
      icon: <FileText className="h-5 w-5" />
    },
    {
      title: "Ebook Builder",
      description: "Create beautiful ebooks from your stories",
      href: "/ebook-builder",
      icon: <BookOpen className="h-5 w-5" />
    },
    {
      title: "Dashboard",
      description: "Access your personal dashboard",
      href: "/dashboard",
      icon: <User className="h-5 w-5" />
    },
    {
      title: "About Us",
      description: "Learn about Flip My Era",
      href: "/about",
      icon: <HelpCircle className="h-5 w-5" />
    }
  ];

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center px-4 py-12">
      <div className="text-center max-w-2xl mx-auto">
        {/* Main 404 Message */}
        <div className="mb-12">
          {contentMessage.icon}
          <h1 className="text-6xl font-bold mb-4 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            404
          </h1>
          <h2 className="text-3xl font-semibold mb-4 text-gray-900">
            {contentMessage.title}
          </h2>
          <p className="text-lg text-gray-600 mb-8 max-w-md mx-auto">
            {contentMessage.description}
          </p>
          
          {/* Content-specific help */}
          {isContentNotFound && (
            <div className="mb-8 p-4 bg-purple-50 rounded-lg border border-purple-200">
              <p className="text-sm text-purple-700">
                <strong>Tip:</strong> Try visiting your{" "}
                <Link to="/past-generations" className="underline hover:text-purple-800">
                  Past Generations
                </Link>{" "}
                page to find your {isEbookNotFound ? 'ebooks' : 'stories'}.
              </p>
            </div>
          )}
          
          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Button 
              variant="outline" 
              onClick={() => window.history.back()}
              className="flex items-center gap-2"
            >
              <ArrowLeft size={16} />
              Go Back
            </Button>
            
            {isContentNotFound ? (
              <Button asChild className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600">
                <Link to="/past-generations" className="flex items-center gap-2">
                  <FileText size={16} />
                  View Past Generations
                </Link>
              </Button>
            ) : (
              <Button asChild className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600">
                <Link to="/" className="flex items-center gap-2">
                  <Home size={16} />
                  Return Home
                </Link>
              </Button>
            )}
          </div>
        </div>

        {/* Popular Pages */}
        <div className="mb-8">
          <h3 className="text-xl font-semibold mb-6 text-gray-900">
            Popular Pages
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {popularPages.map((page) => (
              <Card key={page.href} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-4">
                  <Link 
                    to={page.href}
                    className="flex items-start gap-3 text-left group"
                  >
                    <div className="p-2 rounded-lg bg-purple-100 text-purple-600 group-hover:bg-purple-200 transition-colors">
                      {page.icon}
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 group-hover:text-purple-600 transition-colors">
                        {page.title}
                      </h4>
                      <p className="text-sm text-gray-600 mt-1">
                        {page.description}
                      </p>
                    </div>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Additional Help */}
        <div className="text-center">
          <p className="text-sm text-gray-500 mb-4">
            Still can't find what you're looking for?
          </p>
          <Button variant="ghost" asChild>
            <Link to="/about" className="text-purple-600 hover:text-purple-700">
              Contact Support
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
