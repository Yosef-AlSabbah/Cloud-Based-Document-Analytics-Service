
import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileText, Download, Trash2, Calendar, HardDrive, User, AlertCircle } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface Document {
  id: string;
  name: string;
  title?: string;
  content?: string;
  size: number;
  upload_time: string;
  type: string;
  user_id: string;
}

interface Classification {
  category: string;
  subcategory: string;
  confidence: number;
  algorithm: string;
}

export const DocumentList = () => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [classifications, setClassifications] = useState<Record<string, Classification>>({});
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadDocuments();
    
    // Set up real-time subscriptions
    const documentsChannel = supabase
      .channel('document-list-changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'documents'
      }, (payload) => {
        console.log('Document list change:', payload);
        loadDocuments();
      })
      .subscribe();

    const classificationsChannel = supabase
      .channel('classification-changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'document_classifications'
      }, (payload) => {
        console.log('Classification change:', payload);
        loadDocuments();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(documentsChannel);
      supabase.removeChannel(classificationsChannel);
    };
  }, []);

  const loadDocuments = async () => {
    try {
      setLoading(true);
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Authentication Required",
          description: "Please log in to view your documents",
          variant: "destructive",
        });
        return;
      }

      // Load documents
      const { data: docs, error: docsError } = await supabase
        .from('documents')
        .select('*')
        .eq('user_id', user.id)
        .order('upload_time', { ascending: false });

      if (docsError) throw docsError;

      console.log(`📚 Loaded ${docs?.length || 0} documents`);
      setDocuments(docs || []);

      // Load classifications for all documents
      if (docs && docs.length > 0) {
        const { data: classData, error: classError } = await supabase
          .from('document_classifications')
          .select('*')
          .in('document_id', docs.map(doc => doc.id));

        if (classError) {
          console.warn('Error loading classifications:', classError);
        } else {
          const classMap: Record<string, Classification> = {};
          classData?.forEach(cls => {
            classMap[cls.document_id] = {
              category: cls.category,
              subcategory: cls.subcategory,
              confidence: cls.confidence,
              algorithm: cls.algorithm
            };
          });
          console.log(`🏷️ Loaded ${classData?.length || 0} classifications`);
          setClassifications(classMap);
        }
      }

    } catch (error) {
      console.error('Error loading documents:', error);
      toast({
        title: "Error",
        description: "Failed to load documents",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (doc: Document) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Authentication Required",
          description: "Please log in to download documents",
          variant: "destructive",
        });
        return;
      }

      const filePath = `${user.id}/${doc.id}`;
      const { data, error } = await supabase.storage
        .from('documents')
        .download(filePath);

      if (error) throw error;

      // Create download link
      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = doc.name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: "Download Started",
        description: `Downloading ${doc.title && doc.title.trim() !== '' ? doc.title : doc.name}`,
      });

    } catch (error) {
      console.error('Download error:', error);
      toast({
        title: "Download Failed",
        description: "There was an error downloading the document",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (docId: string, docName: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Authentication Required",
          description: "Please log in to delete documents",
          variant: "destructive",
        });
        return;
      }

      // Delete from storage
      const filePath = `${user.id}/${docId}`;
      const { error: storageError } = await supabase.storage
        .from('documents')
        .remove([filePath]);

      if (storageError) {
        console.warn('Storage deletion error:', storageError);
      }

      // Delete from database (this will cascade to classifications)
      const { error: dbError } = await supabase
        .from('documents')
        .delete()
        .eq('id', docId);

      if (dbError) throw dbError;

      // Immediately update local state to show deletion without waiting for real-time
      setDocuments(prevDocs => prevDocs.filter(doc => doc.id !== docId));

      // Remove the classification from local state
      setClassifications(prevClass => {
        const newClassifications = { ...prevClass };
        delete newClassifications[docId];
        return newClassifications;
      });

      toast({
        title: "Document Deleted",
        description: `${docName} has been deleted successfully`,
      });

    } catch (error) {
      console.error('Delete error:', error);
      toast({
        title: "Delete Failed",
        description: "There was an error deleting the document",
        variant: "destructive",
      });
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.85) return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400";
    if (confidence >= 0.70) return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400";
    return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400";
  };

  if (loading) {
    return (
      <Card className="p-6 glass-card">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <div className="text-foreground">Loading documents...</div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6 glass-card">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold flex items-center text-foreground">
          <FileText className="h-6 w-6 mr-2 text-primary" />
          Document Library ({documents.length})
        </h2>
        <Button onClick={loadDocuments} variant="outline" className="btn-enhanced">
          Refresh
        </Button>
      </div>

      {documents.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <FileText className="h-16 w-16 mx-auto mb-4 text-muted-foreground/50" />
          <h3 className="text-lg font-medium mb-2 text-foreground">No documents uploaded</h3>
          <p>Upload your first document to get started with analysis</p>
        </div>
      ) : (
        <div className="space-y-4">
          {documents.map((doc) => {
            const classification = classifications[doc.id];
            const hasExtractedTitle = doc.title && doc.title.trim() !== '';
            
            return (
              <Card key={doc.id} className="p-4 hover:shadow-md transition-shadow glass-card card-animate">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <FileText className="h-8 w-8 text-primary" />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-lg text-foreground">
                            {hasExtractedTitle ? (
                              <span className="font-bold">{doc.title}</span>
                            ) : (
                              <span className="opacity-75">{doc.name}</span>
                            )}
                          </h3>
                          {!hasExtractedTitle && (
                            <Badge variant="destructive" className="text-xs flex items-center gap-1">
                              <AlertCircle className="h-3 w-3" />
                              Title not found
                            </Badge>
                          )}
                        </div>
                        
                        {hasExtractedTitle && doc.title !== doc.name && (
                          <p className="text-xs text-muted-foreground mb-1">
                            Filename: {doc.name}
                          </p>
                        )}
                        
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <HardDrive className="h-4 w-4" />
                            {formatFileSize(doc.size)}
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            {new Date(doc.upload_time).toLocaleDateString()}
                          </span>
                          <span className="capitalize">
                            {doc.type.split('/')[1] || 'document'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {classification && (
                      <div className="mb-3 p-3 bg-muted/30 dark:bg-muted/10 rounded-lg border border-border">
                        <h4 className="text-sm font-medium text-foreground mb-2">
                          Document Classification
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          <Badge variant="default" className="bg-primary/10 text-primary border-primary/20">
                            {classification.category}
                          </Badge>
                          <Badge variant="secondary" className="bg-secondary/10 text-secondary-foreground border-secondary/20">
                            {classification.subcategory}
                          </Badge>
                          <Badge variant="outline" className={getConfidenceColor(classification.confidence)}>
                            {Math.round(classification.confidence * 100)}% confidence
                          </Badge>
                          <Badge variant="outline" className="text-xs bg-accent/10 text-accent-foreground border-accent/20">
                            {classification.algorithm}
                          </Badge>
                        </div>
                      </div>
                    )}

                    {doc.content && (
                      <div className="mb-3">
                        <p className="text-sm text-muted-foreground line-clamp-3">
                          {doc.content.substring(0, 200)}
                          {doc.content.length > 200 && '...'}
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2 ml-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDownload(doc)}
                      className="btn-enhanced hover:bg-accent hover:text-accent-foreground"
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(doc.id, hasExtractedTitle ? doc.title! : doc.name)}
                      className="btn-enhanced text-destructive hover:text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </Card>
  );
};
