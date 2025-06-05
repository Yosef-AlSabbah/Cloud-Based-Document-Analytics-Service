
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Upload, Search, BarChart3, FileText, LogOut, User } from "lucide-react";
import { DocumentUpload } from "@/components/DocumentUpload";
import { SearchInterface } from "@/components/SearchInterface";
import { DocumentList } from "@/components/DocumentList";
import { SystemStats } from "@/components/SystemStats";
import { AnalyticsDashboard } from "@/components/AnalyticsDashboard";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { User as SupabaseUser } from "@supabase/supabase-js";

const Index = () => {
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    // Check current auth status
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (!session?.user) {
        navigate('/auth');
      }
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
      if (!session?.user) {
        navigate('/auth');
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast({
        title: "Error",
        description: "Failed to sign out",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Signed Out",
        description: "You have been successfully signed out",
      });
      navigate('/auth');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center animate-fade-in">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-6"></div>
          <p className="text-gray-600 text-lg font-medium">Loading your workspace...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect to auth
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md shadow-sm border-b border-white/20 sticky top-0 z-50 animate-fade-in">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center py-4 gap-4 sm:gap-0">
            <div className="flex items-center space-x-3 animate-slide-in-right">
              <div className="p-2 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl shadow-lg transform hover:scale-105 transition-all duration-300">
                <FileText className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900 bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  Cloud Document Analytics
                </h1>
                <p className="text-xs sm:text-sm text-gray-600">
                  Advanced document processing and search platform
                </p>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 w-full sm:w-auto">
              <div className="flex items-center space-x-2 text-sm text-gray-600 bg-white/50 px-3 py-2 rounded-lg backdrop-blur-sm">
                <User className="h-4 w-4" />
                <span className="truncate max-w-[200px]">{user.email}</span>
              </div>
              <Button 
                variant="outline" 
                onClick={handleSignOut}
                className="flex items-center space-x-2 hover:bg-red-50 hover:border-red-200 hover:text-red-700 transition-all duration-300 transform hover:scale-105 w-full sm:w-auto justify-center"
              >
                <LogOut className="h-4 w-4" />
                <span>Sign Out</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* System Stats */}
        <div className="mb-6 sm:mb-8 animate-fade-in" style={{ animationDelay: '0.1s' }}>
          <SystemStats />
        </div>

        {/* Main Content */}
        <div className="animate-fade-in" style={{ animationDelay: '0.2s' }}>
          <Tabs defaultValue="upload" className="space-y-6">
            <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 h-auto p-1 bg-white/60 backdrop-blur-sm shadow-lg border border-white/20">
              <TabsTrigger 
                value="upload" 
                className="flex flex-col sm:flex-row items-center space-y-1 sm:space-y-0 sm:space-x-2 py-3 sm:py-2 data-[state=active]:bg-white data-[state=active]:shadow-md transition-all duration-300 hover:scale-105"
              >
                <Upload className="h-4 w-4" />
                <span className="text-xs sm:text-sm">Upload</span>
              </TabsTrigger>
              <TabsTrigger 
                value="search" 
                className="flex flex-col sm:flex-row items-center space-y-1 sm:space-y-0 sm:space-x-2 py-3 sm:py-2 data-[state=active]:bg-white data-[state=active]:shadow-md transition-all duration-300 hover:scale-105"
              >
                <Search className="h-4 w-4" />
                <span className="text-xs sm:text-sm">Search</span>
              </TabsTrigger>
              <TabsTrigger 
                value="documents" 
                className="flex flex-col sm:flex-row items-center space-y-1 sm:space-y-0 sm:space-x-2 py-3 sm:py-2 data-[state=active]:bg-white data-[state=active]:shadow-md transition-all duration-300 hover:scale-105"
              >
                <FileText className="h-4 w-4" />
                <span className="text-xs sm:text-sm">Documents</span>
              </TabsTrigger>
              <TabsTrigger 
                value="analytics" 
                className="flex flex-col sm:flex-row items-center space-y-1 sm:space-y-0 sm:space-x-2 py-3 sm:py-2 data-[state=active]:bg-white data-[state=active]:shadow-md transition-all duration-300 hover:scale-105"
              >
                <BarChart3 className="h-4 w-4" />
                <span className="text-xs sm:text-sm">Analytics</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="upload" className="space-y-6 animate-fade-in">
              <DocumentUpload />
            </TabsContent>

            <TabsContent value="search" className="space-y-6 animate-fade-in">
              <SearchInterface />
            </TabsContent>

            <TabsContent value="documents" className="space-y-6 animate-fade-in">
              <DocumentList />
            </TabsContent>

            <TabsContent value="analytics" className="space-y-6 animate-fade-in">
              <AnalyticsDashboard />
            </TabsContent>
          </Tabs>
        </div>
      </main>

      {/* Footer with Personal Branding */}
      <footer className="mt-16 bg-white/60 backdrop-blur-md border-t border-white/20 animate-fade-in" style={{ animationDelay: '0.3s' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="text-center sm:text-left">
              <p className="text-sm text-gray-600">
                © 2025 Cloud Document Analytics Platform
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Islamic University of Gaza - Faculty of Information Technology
              </p>
            </div>
            <div className="text-center sm:text-right">
              <p className="text-sm font-medium text-gray-700 bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                Made with ❤️ by Yousef M. Y. Al Sabbah
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Advanced Document Processing & Analytics
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
