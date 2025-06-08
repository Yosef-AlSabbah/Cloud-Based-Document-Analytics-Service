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
import { toast } from "sonner";
import { Document } from "@/utils/types";

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
  const [searchResults, setSearchResults] = useState<Document[]>([]);

  // Fetch documents and their classifications
  const fetchDocuments = async () => {
    try {
      setIsLoading(true);
      console.log('Fetching documents with classifications...');
      
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.warn('No authenticated user found');
        setIsLoading(false);
        return;
      }
      
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
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (docsError) {
        console.error('Error fetching documents:', docsError);
        return;
      }

      if (documentsData) {
        console.log('Fetched documents:', documentsData.length);
        
        // Convert to Document interface and handle date conversions
        const processedDocs: Document[] = documentsData.map(doc => ({
          id: doc.id,
          title: doc.title || doc.name || 'Untitled Document',
          content: doc.content || '',
          filename: doc.name,
          size: doc.size,
          type: doc.type,
          uploadDate: new Date(doc.created_at),
          classification: doc.document_classifications?.length > 0 
            ? doc.document_classifications[0].category 
            : 'Unclassified',
          confidence: doc.document_classifications?.length > 0 
            ? doc.document_classifications[0].confidence 
            : 0,
          document_classifications: doc.document_classifications,
          created_at: doc.created_at,
          updated_at: doc.updated_at,
          user_id: doc.user_id
        }));
        
        setDocuments(processedDocs);
        
        // Show notification
        if (documentsData.length > 0) {
          toast.info(`Loaded ${documentsData.length} documents`);
        }
      }
    } catch (error) {
      console.error('Error in fetchDocuments:', error);
      toast.error('Failed to load documents');
    } finally {
      setIsLoading(false);
    }
  };

  // Initial fetch and set up real-time subscriptions
  useEffect(() => {
    fetchDocuments();

    // Set up real-time subscription for document changes
    const documentsChannel = supabase.channel('document-updates')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'documents'
      }, (payload) => {
        console.log('Document change detected:', payload);
        fetchDocuments(); // Refresh documents on any change
        
        if (payload.eventType === 'INSERT') {
          toast.success('New document added');
        } else if (payload.eventType === 'UPDATE') {
          toast.info('Document updated');
        } else if (payload.eventType === 'DELETE') {
          toast.info('Document removed');
        }
      })
      .subscribe();
    
    // Set up real-time subscription for classification updates
    const classificationsChannel = supabase.channel('classification-updates')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'document_classifications'
      }, () => {
        console.log('Classification change detected, updating documents...');
        fetchDocuments(); // Refresh documents with new classifications
        toast.success('Document classification updated');
      })
      .subscribe();
    
    return () => {
      supabase.removeChannel(documentsChannel);
      supabase.removeChannel(classificationsChannel);
    };
  }, [setDocuments]);

  const handleUploadComplete = () => {
    console.log('Upload completed - refreshing documents');
    fetchDocuments();
  };

  const handleSearch = (query: string, filters: any) => {
    console.log('Search handler called:', { query, filters });
    setSearchQuery(query);
    setSearchFilters(filters);
  };

  const handleSearchResults = (results: Document[]) => {
    console.log('Search results received:', results.length);
    setSearchResults(results);
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case "overview":
        return (
          <div className="space-y-8 animate-fade-in">
            <div className="text-center">
              <h2 className="text-3xl font-bold text-foreground mb-4 no-select">
                Cloud Document Analytics Dashboard
              </h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Welcome to your Cloud Document Analytics dashboard. Monitor your uploads, search activity, and system performance.
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
        
        {isLoading && activeTab !== "analytics" && (
          <div className="flex items-center justify-center p-4 mb-6 bg-muted/50 rounded-lg animate-pulse">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary mr-3"></div>
            <span className="text-muted-foreground">Loading data...</span>
          </div>
        )}
        
        <div className="transform transition-all duration-500 animate-float">
          {renderTabContent()}
        </div>
      </div>
    </main>
  );
};

export default DashboardContent;
