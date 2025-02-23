
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { Toaster } from "@/components/ui/toaster";
import Index from "@/pages/Index";
import Settings from "@/pages/Settings";
import NotFound from "@/pages/NotFound";
import Stories from "@/pages/Stories";
import Auth from "@/pages/Auth";

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/stories" element={<Stories />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Layout>
      <Toaster />
    </Router>
  );
}

export default App;
