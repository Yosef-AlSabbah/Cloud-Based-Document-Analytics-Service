
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import TabNavigation from "@/components/dashboard/TabNavigation";
import DashboardContent from "@/components/dashboard/DashboardContent";
import DashboardFooter from "@/components/dashboard/DashboardFooter";
import { supabase } from "@/integrations/supabase/client";

/**
 * Main dashboard component with full document management functionality
 */
const Index = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("overview");
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [user, setUser] = useState<any>(null);

  // Add state for search functionality
  const [searchQuery, setSearchQuery] = useState("");
  const [searchFilters, setSearchFilters] = useState({
    category: '',
    fileType: '',
    dateRange: ''
  });
  const [documents, setDocuments] = useState([]);

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
    { id: "overview", label: "Overview", icon: "Home" },
    { id: "upload", label: "My Documents", icon: "Upload" },
    { id: "search", label: "Search & Browse", icon: "Search" },
    { id: "analytics", label: "Analytics", icon: "BarChart3" },
    { id: "settings", label: "System Stats", icon: "Settings" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 dark:from-gray-900 dark:via-blue-900 dark:to-indigo-900 transition-all duration-500 page-transition">
      <DashboardHeader 
        user={user}
        isProfileOpen={isProfileOpen}
        setIsProfileOpen={setIsProfileOpen}
        handleLogout={handleLogout}
        navigate={navigate}
      />

      <TabNavigation 
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        tabItems={tabItems}
      />

      <DashboardContent 
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        searchFilters={searchFilters}
        setSearchFilters={setSearchFilters}
        documents={documents}
        setDocuments={setDocuments}
      />

      <DashboardFooter />
    </div>
  );
};

export default Index;
