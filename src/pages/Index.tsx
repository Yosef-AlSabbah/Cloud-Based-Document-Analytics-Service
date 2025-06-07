/**
 * Cloud Document Analytics Platform - Main Dashboard
 *
 * @author Yousef M. Y. Al Sabbah
 * @course Cloud and Distributed Systems
 * @university Islamic University of Gaza
 * @date June 3, 2025
 *
 * Main dashboard component integrating all document processing features
 */

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { FileText, Home, User, MessageCircle, LogOut, Upload, Search, BarChart3, Settings, ChevronDown } from "lucide-react";
import DocumentUpload from "@/components/DocumentUpload";
import { DocumentList } from "@/components/DocumentList";
import SearchInterface from "@/components/SearchInterface";
import { ClassificationPanel } from "@/components/ClassificationPanel";
import AnalyticsDashboard from "@/components/AnalyticsDashboard";
import { SystemStats } from "@/components/SystemStats";
import { PersistentStats } from "@/components/PersistentStats";
import { ThemeToggle } from "@/components/ThemeToggle";
import { supabase } from "@/integrations/supabase/client";

/**
 * Main dashboard component with full document management functionality
 */
const Index = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("overview");
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [user, setUser] = useState<any>(null);

  // Scroll to top on component mount
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Get current user
  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };
    getUser();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  const tabItems = [
    { id: "overview", label: "Overview", icon: Home },
    { id: "upload", label: "My Documents", icon: Upload },
    { id: "search", label: "Search & Browse", icon: Search },
    { id: "analytics", label: "Analytics", icon: BarChart3 },
    { id: "settings", label: "System Stats", icon: Settings },
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case "overview":
        return (
          <div className="space-y-8 animate-fade-in">
            <div className="text-center">
              <h2 className="text-3xl font-bold text-foreground mb-4 no-select">
                Dashboard Overview
              </h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Welcome to your document analytics dashboard. Monitor your uploads, search activity, and system performance.
              </p>
            </div>
            
            {/* Enhanced System Stats */}
            <div className="transform transition-all duration-500 hover:scale-[1.02]">
              <SystemStats />
            </div>
            
            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { title: "Upload Documents", desc: "Add new files", icon: Upload, action: () => setActiveTab("upload") },
                { title: "Search Files", desc: "Find documents", icon: Search, action: () => setActiveTab("search") },
                { title: "View Analytics", desc: "Performance insights", icon: BarChart3, action: () => setActiveTab("analytics") },
                { title: "System Status", desc: "Health monitoring", icon: Settings, action: () => setActiveTab("settings") }
              ].map((item, index) => (
                <Card 
                  key={item.title}
                  className="p-6 cursor-pointer glass-card animate-fade-in card-animate hover-glow icon-hover"
                  style={{ animationDelay: `${index * 0.1}s` }}
                  onClick={item.action}
                >
                  <div className="flex flex-col items-center text-center space-y-3">
                    <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-lg icon-hover">
                      <item.icon className="h-6 w-6 text-white" />
                    </div>
                    <h3 className="font-semibold text-foreground no-select">{item.title}</h3>
                    <p className="text-sm text-muted-foreground">{item.desc}</p>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        );
      case "upload":
        return (
          <div className="space-y-8 animate-fade-in">
            <div className="text-center">
              <h2 className="text-3xl font-bold text-foreground mb-4 no-select">
                Upload & Process Documents
              </h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Upload PDF and Word documents for intelligent processing, classification, and analysis.
              </p>
            </div>
            <DocumentUpload />
            <ClassificationPanel />
          </div>
        );
      case "search":
        return (
          <div className="space-y-8 animate-fade-in">
            <div className="text-center">
              <h2 className="text-3xl font-bold text-foreground mb-4 no-select">
                Search & Browse Documents
              </h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Find documents using intelligent search algorithms and browse your collection.
              </p>
            </div>
            <SearchInterface />
            <DocumentList />
          </div>
        );
      case "analytics":
        return (
          <div className="space-y-8 animate-fade-in">
            <div className="text-center">
              <h2 className="text-3xl font-bold text-foreground mb-4 no-select">
                Analytics Dashboard
              </h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Comprehensive analytics and insights about your document collection.
              </p>
            </div>
            <AnalyticsDashboard />
          </div>
        );
      case "settings":
        return (
          <div className="space-y-8 animate-fade-in">
            <div className="text-center">
              <h2 className="text-3xl font-bold text-foreground mb-4 no-select">
                System Statistics
              </h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Monitor system performance and document processing statistics.
              </p>
            </div>
            <SystemStats />
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 dark:from-gray-900 dark:via-blue-900 dark:to-indigo-900 transition-all duration-500 page-transition">
      {/* Enhanced Header */}
      <header className="glass-header sticky top-0 z-50 transition-all duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-3 animate-slide-in-right">
              <div className="p-2 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl shadow-lg hover:scale-110 transition-transform duration-300 icon-hover">
                <FileText className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent no-select">
                  Cloud Document Analytics
                </h1>
                <div className="text-sm text-muted-foreground font-medium no-select">
                  Professional Document Workflow Platform
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-4 animate-slide-in-left">
              <ThemeToggle />
              
              <div className="hidden sm:flex items-center space-x-2">
                <Button 
                  variant="ghost" 
                  onClick={() => navigate('/')}
                  className="btn-enhanced flex items-center space-x-2 hover:bg-accent hover:text-accent-foreground transition-all duration-300 icon-hover"
                >
                  <Home className="h-4 w-4" />
                  <span>Home</span>
                </Button>
                <Button 
                  variant="ghost" 
                  onClick={() => navigate('/about')}
                  className="btn-enhanced flex items-center space-x-2 hover:bg-accent hover:text-accent-foreground transition-all duration-300 icon-hover"
                >
                  <User className="h-4 w-4" />
                  <span>About</span>
                </Button>
                <Button 
                  variant="ghost" 
                  onClick={() => navigate('/contact')}
                  className="btn-enhanced flex items-center space-x-2 hover:bg-accent hover:text-accent-foreground transition-all duration-300 icon-hover"
                >
                  <MessageCircle className="h-4 w-4" />
                  <span>Contact</span>
                </Button>
              </div>
              
              {/* Profile Dropdown */}
              <div className="relative">
                <Button 
                  variant="ghost"
                  onClick={() => setIsProfileOpen(!isProfileOpen)}
                  className="btn-enhanced flex items-center space-x-2 hover:bg-accent hover:text-accent-foreground transition-all duration-300 icon-hover"
                >
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center">
                    <User className="h-4 w-4 text-white" />
                  </div>
                  <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${isProfileOpen ? 'rotate-180' : ''}`} />
                </Button>
                
                {isProfileOpen && (
                  <div className="absolute right-0 mt-2 w-48 glass-card animate-scale-in z-50">
                    <div className="p-3 border-b border-border">
                      <p className="text-sm font-medium text-foreground">
                        {user?.email || 'User'}
                      </p>
                    </div>
                    <Button 
                      variant="ghost"
                      onClick={handleLogout}
                      className="w-full justify-start px-3 py-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-none rounded-b-lg icon-hover"
                    >
                      <LogOut className="h-4 w-4 mr-2" />
                      Logout
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Horizontal Tab Navigation */}
      <div className="glass-header border-b border-border sticky top-[73px] z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex overflow-x-auto scrollbar-hide py-4 space-x-2">
            {tabItems.map((item, index) => (
              <Button
                key={item.id}
                variant={activeTab === item.id ? "default" : "ghost"}
                onClick={() => setActiveTab(item.id)}
                className={`
                  btn-enhanced flex items-center space-x-2 px-6 py-3 font-medium whitespace-nowrap icon-hover
                  ${activeTab === item.id 
                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg transform scale-105' 
                    : 'hover:bg-accent hover:text-accent-foreground hover:scale-105'
                  }
                  transition-all duration-300 animate-fade-in
                `}
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <item.icon className="h-5 w-5" />
                <span>{item.label}</span>
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="p-6 lg:p-8">
        <div className="max-w-7xl mx-auto">
          {/* Persistent Stats */}
          <PersistentStats />
          
          <div className="transform transition-all duration-500 animate-float">
            {renderTabContent()}
          </div>
        </div>
      </main>

      {/* Enhanced Footer */}
      <footer className="glass-header text-foreground py-12 px-4 sm:px-6 lg:px-8 mt-16 transition-all duration-300">
        <div className="max-w-7xl mx-auto text-center">
          <div className="flex items-center justify-center space-x-3 mb-4 animate-fade-in">
            <div className="p-2 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl hover:scale-110 transition-transform duration-300 icon-hover">
              <FileText className="h-6 w-6 text-white" />
            </div>
            <h3 className="text-xl font-bold no-select">Cloud Document Analytics</h3>
          </div>
          <p className="text-muted-foreground mb-4">
            Advanced document processing and analytics platform
          </p>
          <div className="border-t border-border pt-4">
            <p className="text-sm text-muted-foreground">
              © 2025 Cloud Document Analytics Platform. Islamic University of Gaza - Faculty of Information Technology
            </p>
            <p className="text-sm text-foreground mt-2">
              Made with ❤️ by <span className="font-semibold bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">Yousef M. Y. Al-Sabbah</span>
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
