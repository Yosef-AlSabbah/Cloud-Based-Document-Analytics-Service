
import { useState, useEffect } from "react";
import DocumentUpload from "@/components/DocumentUpload";
import { DocumentList } from "@/components/DocumentList";
import SearchInterface from "@/components/SearchInterface";
import { ClassificationPanel } from "@/components/ClassificationPanel";
import AnalyticsDashboard from "@/components/AnalyticsDashboard";
import { SystemStats } from "@/components/SystemStats";
import { PersistentStats } from "@/components/PersistentStats";
import QuickActions from "./QuickActions";
import { supabase } from "@/integrations/supabase/client";

interface DashboardContentProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  searchFilters: any;
  setSearchFilters: (filters: any) => void;
  documents: any[];
  setDocuments: (docs: any[]) => void;
}

const DashboardContent = ({
  activeTab,
  setActiveTab,
  searchQuery,
  setSearchQuery,
  searchFilters,
  setSearchFilters,
  documents,
  setDocuments
}: DashboardContentProps) => {
  const [isLoading, setIsLoading] = useState(false);

  // Fetch documents and their classifications
  const fetchDocuments = async () => {
    try {
      setIsLoading(true);
      console.log('Fetching documents with classifications...');
      
      const { data: documentsData, error: docsError } = await supabase
        .from('documents')
        .select(`
          *,
          document_classifications (
            category,
            subcategory,
            confidence,
            algorithm
          )
        `)
        .order('created_at', { ascending: false });

      if (docsError) {
        console.error('Error fetching documents:', docsError);
        return;
      }

      if (documentsData) {
        console.log('Fetched documents:', documentsData.length);
        setDocuments(documentsData);
      }
    } catch (error) {
      console.error('Error in fetchDocuments:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Initial fetch and refresh on tab change
  useEffect(() => {
    fetchDocuments();
  }, [setDocuments]);

  const handleUploadComplete = () => {
    console.log('Upload completed - refreshing documents');
    fetchDocuments();
  };

  const handleSearch = (query: string, filters: any) => {
    console.log('Search handler called:', { query, filters });
    setSearchQuery(query);
    setSearchFilters(filters);
    
    // Log search activity
    if (query.length >= 3) {
      supabase.from('search_logs').insert({
        query,
        results_count: 0, // Will be updated when results are processed
        search_time_ms: 0,
        user_id: 'anonymous' // Update with actual user ID when auth is implemented
      }).then(({ error }) => {
        if (error) console.error('Error logging search:', error);
      });
    }
  };

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

            <div className="transform transition-all duration-500 hover:scale-[1.02]">
              <SystemStats />
            </div>

            <QuickActions setActiveTab={setActiveTab} />
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
            
            <DocumentUpload onUploadComplete={handleUploadComplete} />
            
            <div className="[&_.text-gray-600]:text-foreground [&_.text-gray-500]:text-muted-foreground [&_.text-gray-700]:text-foreground [&_.text-gray-800]:text-foreground [&_.text-black]:text-foreground [&_h3]:text-foreground [&_h4]:text-foreground [&_span]:text-foreground">
              <ClassificationPanel />
            </div>
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
            
            <SearchInterface
              onSearch={handleSearch}
              searchQuery={searchQuery}
              filters={searchFilters}
            />
            
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
            
            {isLoading ? (
              <div className="flex items-center justify-center p-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                <span className="ml-2 text-muted-foreground">Loading analytics...</span>
              </div>
            ) : (
              <AnalyticsDashboard documents={documents} />
            )}
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
    <main className="p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <PersistentStats />
        
        <div className="transform transition-all duration-500 animate-float">
          {renderTabContent()}
        </div>
      </div>
    </main>
  );
};

export default DashboardContent;
