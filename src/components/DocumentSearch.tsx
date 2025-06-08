// -------------------------------------------------------------
// Cloud-Based-Document-Analytics-Service
// Author: Yousef M. Y. Al Sabbah
// https://github.com/Yosef-AlSabbah/Cloud-Based-Document-Analytics-Service
// -------------------------------------------------------------

import { useState, useEffect, useCallback, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, FileText, Clock, Filter, Download, Trash2, Calendar, HardDrive, ArrowUpDown } from "lucide-react";
import { Document } from "@/utils/types";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";

interface DocumentSearchProps {
  documents: Document[];
  onSearchResults: (results: Document[]) => void;
}

const DocumentSearch = ({ documents, onSearchResults }: DocumentSearchProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Document[]>([]);
  const [searchTime, setSearchTime] = useState<number>(0);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [isInitialized, setIsInitialized] = useState(false); // Add this state
  const { toast } = useToast();

  const formatFileType = (mimeType: string): string => {
    const typeMap: { [key: string]: string } = {
      'application/pdf': 'PDF',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'DOCX',
      'application/msword': 'DOC',
      'text/plain': 'TXT',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'XLSX',
      'application/vnd.ms-excel': 'XLS',
      'image/jpeg': 'JPEG',
      'image/png': 'PNG'
    };

    return typeMap[mimeType] || mimeType.split('/').pop()?.toUpperCase() || 'Unknown';
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.85) return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400";
    if (confidence >= 0.70) return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400";
    return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400";
  };

  const highlightText = (text: string, query: string): string => {
    if (!query.trim() || !text) return text || '';

    const keywords = query.toLowerCase().split(/\s+/).filter(word => word.length > 0);
    let highlightedText = text;

    try {
      keywords.forEach(keyword => {
        if (keyword.length < 2) return;

        const regex = new RegExp(`(\\b${keyword}\\b|${keyword})`, 'gi');
        highlightedText = highlightedText.replace(regex, '<mark class="bg-yellow-200 dark:bg-yellow-700 px-1 rounded">$1</mark>');
      });
    } catch (error) {
      console.error('Error highlighting text:', error);
    }

    return highlightedText;
  };

  // Extract a relevant snippet that contains the search keyword
  const extractRelevantSnippet = (content: string, query: string, maxLength: number = 200): string => {
    if (!content || !query.trim()) return content?.substring(0, maxLength) + (content?.length > maxLength ? '...' : '') || '';

    const keywords = query.toLowerCase().split(/\s+/).filter(word => word.length > 0);
    const contentLower = content.toLowerCase();

    // Try to find a position where one of the keywords appears
    let startPos = -1;
    for (const keyword of keywords) {
      if (keyword.length < 2) continue;

      const pos = contentLower.indexOf(keyword);
      if (pos !== -1) {
        startPos = pos;
        break;
      }
    }

    // If no keyword found, just return the beginning of the content
    if (startPos === -1) {
      return content.substring(0, maxLength) + (content.length > maxLength ? '...' : '');
    }

    // Calculate the snippet range, centering on the keyword
    const halfLength = Math.floor(maxLength / 2);
    let snippetStart = Math.max(0, startPos - halfLength);
    const snippetEnd = Math.min(content.length, snippetStart + maxLength);

    // Make sure we don't cut in the middle of a word at the beginning
    if (snippetStart > 0) {
      while (snippetStart > 0 && content[snippetStart] !== ' ' && content[snippetStart] !== '.') {
        snippetStart--;
      }
      snippetStart++; // Move past the space or period
    }

    let snippet = content.substring(snippetStart, snippetEnd);

    // Add ellipsis if needed
    if (snippetStart > 0) snippet = '...' + snippet;
    if (snippetEnd < content.length) snippet = snippet + '...';

    return snippet;
  };

  const calculateMatchCount = (doc: Document, query: string): number => {
    const keywords = query.toLowerCase().split(/\s+/).filter(word => word.length > 0);
    const searchableText = `${doc.title || ''} ${doc.content || ''}`.toLowerCase();
    
    return keywords.reduce((count, keyword) => {
      return count + (searchableText.match(new RegExp(keyword, 'g')) || []).length;
    }, 0);
  };

  const calculateScore = (doc: Document, query: string): number => {
    const matchCount = calculateMatchCount(doc, query);
    const titleBonus = (doc.title || '').toLowerCase().includes(query.toLowerCase()) ? 2 : 0;
    return matchCount + titleBonus;
  };

  const searchDocuments = useCallback(async (query: string) => {
    const trimmedQuery = query.trim();

    if (!trimmedQuery) {
      // Show all documents when no search query
      setSearchResults(documents);
      onSearchResults(documents);
      setSearchTime(0);
      setHasSearched(false);
      setSelectedDocument(null);
      return;
    }

    setIsSearching(true);
    const startTime = performance.now();

    try {
      const keywords = trimmedQuery.toLowerCase().split(/\s+/).filter(word => word.length > 0);

      // Filter documents and remove duplicates using Map with document ID as key
      const resultsMap = new Map<string, Document>();

      documents.forEach(doc => {
        const searchableText = `${doc.title || ''} ${doc.content || ''} ${doc.filename || ''}`.toLowerCase();
        const matches = keywords.some(keyword => searchableText.includes(keyword));

        if (matches && !resultsMap.has(doc.id)) {
          resultsMap.set(doc.id, doc);
        }
      });

      const uniqueResults = Array.from(resultsMap.values());

      // Sort results by relevance (score)
      uniqueResults.sort((a, b) => {
        const aScore = calculateScore(a, trimmedQuery);
        const bScore = calculateScore(b, trimmedQuery);
        return bScore - aScore;
      });

      const endTime = performance.now();
      const searchTimeMs = endTime - startTime;

      setSearchTime(searchTimeMs);
      setSearchResults(uniqueResults);
      setHasSearched(true);
      onSearchResults(uniqueResults);
      setSelectedDocument(null);

      console.log(`Search completed in ${searchTimeMs.toFixed(2)}ms, found ${uniqueResults.length} unique results for query: "${trimmedQuery}"`);

      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user && trimmedQuery.length >= 3) {
          await supabase.from('search_logs').insert({
            query: trimmedQuery,
            results_count: uniqueResults.length,
            search_time_ms: Math.round(searchTimeMs),
            user_id: user.id
          });
        }
      } catch (error) {
        console.error('Error logging search:', error);
      }
    } catch (error) {
      console.error('Error during search:', error);
      toast({
        title: "Search Failed",
        description: "There was an error performing your search",
        variant: "destructive",
      });
    } finally {
      setIsSearching(false);
    }
  }, [documents, onSearchResults, toast]);

  // Initialize component with all documents - Make sure this runs on mount
  useEffect(() => {
    if (documents && documents.length > 0 && !isInitialized) {
      console.log(`📚 Initializing with all ${documents.length} documents on component mount`);
      setSearchResults(documents);
      onSearchResults(documents);
      setHasSearched(false);
      setIsInitialized(true); // Mark as initialized
    }
  }, [documents, onSearchResults, isInitialized]);

  // Debounce search - wait 500ms after typing stops with 3 character minimum
  useEffect(() => {
    const trimmedQuery = searchQuery.trim();

    if (trimmedQuery.length === 0) {
      // Only update state locally for empty queries, don't trigger external search
      console.log('📋 Empty query detected - showing all documents without triggering search');
      setSearchResults(documents);
      setSearchTime(0);
      setHasSearched(false);
      setIsSearching(false);
      setSelectedDocument(null);

      // Don't call onSearchResults() here to prevent triggering external search logic
      return;
    }

    // Search only with 3+ characters
    if (trimmedQuery.length >= 3) {
      console.log(`⏱️ Waiting 500ms before searching for: "${trimmedQuery}"`);
      setIsSearching(true);

      // Create a timer that will execute search after 500ms of no typing
      const timer = setTimeout(() => {
        console.log(`🔍 Searching for: "${trimmedQuery}"`);
        searchDocuments(trimmedQuery);
      }, 500);

      // Clear the timer if user types again within 500ms
      return () => {
        clearTimeout(timer);
        console.log('⏱️ Search timer cleared - user still typing');
      };
    } else if (trimmedQuery.length > 0 && trimmedQuery.length < 3) {
      // Show message that minimum 3 characters are needed
      setIsSearching(false);
      setHasSearched(false);
      setSearchResults(documents);
    }
  }, [searchQuery, searchDocuments, documents]);

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      const trimmedQuery = searchQuery.trim();
      if (trimmedQuery) {
        searchDocuments(trimmedQuery);
      }
    }
  };

  const sortDocumentsByTitle = (docs: Document[]): Document[] => {
    return [...docs].sort((a, b) => {
      const titleA = (a.title || a.filename || '').toLowerCase();
      const titleB = (b.title || b.filename || '').toLowerCase();

      if (sortOrder === 'asc') {
        return titleA.localeCompare(titleB);
      } else {
        return titleB.localeCompare(titleA);
      }
    });
  };

  const toggleSortOrder = () => {
    setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
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

      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = doc.filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: "Download Started",
        description: `Downloading ${doc.title || doc.filename}`,
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

      const filePath = `${user.id}/${docId}`;
      const { error: storageError } = await supabase.storage
          .from('documents')
          .remove([filePath]);

      if (storageError) {
        console.warn('Storage deletion error:', storageError);
      }

      const { error: dbError } = await supabase
          .from('documents')
          .delete()
          .eq('id', docId);

      if (dbError) throw dbError;

      setSearchResults(prevResults => prevResults.filter(doc => doc.id !== docId));

      // If the deleted document was selected, clear the selection
      if (selectedDocument?.id === docId) {
        setSelectedDocument(null);
      }

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

  const formatSearchTime = (time: number): string => {
    if (time < 1) return '<1ms';
    return `${time.toFixed(2)}ms`;
  };

  const documentStats = useMemo(() => {
    const totalDocuments = documents.length;
    const totalSize = documents.reduce((sum, doc) => sum + doc.size, 0);
    const avgSize = totalDocuments > 0 ? totalSize / totalDocuments : 0;

    return {
      total: totalDocuments,
      totalSize,
      avgSize
    };
  }, [documents]);

  const trimmedQuery = searchQuery.trim();

  // Display all documents when no search, otherwise display search results
  const displayedDocuments = hasSearched
      ? searchResults
      : (searchResults.length > 0 ? searchResults : documents);
  const sortedDisplayedDocuments = sortDocumentsByTitle(displayedDocuments);

  return (
      <div className="space-y-6">
        {/* Search Interface */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              Cloud Document Analytics Search
            </CardTitle>
            <CardDescription>
              Search through your document collection using keywords and phrases
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                    placeholder="Search documents... (minimum 3 characters, waits 500ms after you stop typing)"
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                    }}
                    onKeyPress={handleKeyPress}
                    className="pl-10"
                    disabled={isSearching}
                />
                {isSearching && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                    </div>
                )}
              </div>
              <Button
                  onClick={() => searchDocuments(trimmedQuery)}
                  disabled={trimmedQuery.length < 3 || isSearching}
              >
                <Search className="h-4 w-4 mr-2" />
                Search
              </Button>
            </div>

            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <FileText className="h-4 w-4" />
                <span>{documentStats.total} documents</span>
              </div>
              {searchTime > 0 && (
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    <span>Search time: {formatSearchTime(searchTime)}</span>
                  </div>
              )}
              {hasSearched && searchResults.length > 0 && (
                  <div className="flex items-center gap-1">
                    <Filter className="h-4 w-4" />
                    <span>{searchResults.length} results found</span>
                  </div>
              )}
              {isSearching && (
                  <div className="flex items-center gap-1">
                    <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-primary"></div>
                    <span>Searching...</span>
                  </div>
              )}
            </div>

          </CardContent>
        </Card>

        {/* Enhanced Search Results */}
        {hasSearched && searchResults.length > 0 && (
            <Card className="glass-card border-border/50">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold flex items-center">
                    <Search className="h-5 w-5 mr-2" />
                    Search Results for "{trimmedQuery}"
                  </h3>
                  <div className="flex gap-2">
                    <Badge variant="secondary" className="text-xs">
                      {searchResults.length} results
                    </Badge>
                    <Badge variant="secondary" className="text-xs flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {formatSearchTime(searchTime)}
                    </Badge>
                  </div>
                </div>

                <div className="space-y-4">
                  {searchResults.map((doc) => {
                    const matchCount = calculateMatchCount(doc, trimmedQuery);
                    const score = calculateScore(doc, trimmedQuery);
                    
                    return (
                      <Card key={doc.id} className="p-4 border-l-4 border-l-primary">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <FileText className="h-5 w-5 text-primary" />
                              <h4 
                                className="font-semibold text-foreground"
                                dangerouslySetInnerHTML={{
                                  __html: highlightText(doc.title || doc.filename, trimmedQuery)
                                }}
                              />
                              <Badge variant="outline" className="text-xs">
                                File: {doc.filename}
                              </Badge>
                              <Badge variant="secondary" className="text-xs">
                                {matchCount} matches
                              </Badge>
                              <Badge variant="default" className="text-xs">
                                Score: {score}
                              </Badge>
                            </div>

            {doc.content && (
              <div className="mb-3 p-3 bg-muted/30 dark:bg-muted/10 rounded-lg">
                <div className="flex items-center gap-1 mb-2">
                  <Search className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium text-foreground">Content preview:</span>
                </div>
                <div 
                  className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line"
                  dangerouslySetInnerHTML={{
                    __html: highlightText(extractRelevantSnippet(doc.content, trimmedQuery, 500), trimmedQuery)
                  }}
                />
              </div>
            )}

                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                              <span>{formatFileSize(doc.size)}</span>
                              <span>{new Date(doc.uploadDate).toLocaleDateString()}</span>
                              <span className="capitalize">{formatFileType(doc.type)}</span>
                            </div>
                          </div>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              </div>
            </Card>
        )}

        {/* All Documents Display */}
        {!hasSearched && sortedDisplayedDocuments.length > 0 && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>All Documents ({sortedDisplayedDocuments.length})</CardTitle>
                    <CardDescription>All available documents in your collection</CardDescription>
                  </div>
                  <Button
                      onClick={toggleSortOrder}
                      variant="outline"
                      size="sm"
                      className="flex items-center gap-2"
                  >
                    <ArrowUpDown className="h-4 w-4" />
                    Sort {sortOrder === 'asc' ? 'A-Z' : 'Z-A'}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {sortedDisplayedDocuments.map((doc) => (
                      <div
                          key={doc.id}
                          onClick={() => setSelectedDocument(doc)}
                          className="p-4 border rounded-lg hover:bg-muted/30 cursor-pointer transition-colors"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4 className="font-medium text-foreground mb-1">
                              {doc.title || doc.filename}
                            </h4>
                            <p className="text-sm text-muted-foreground mb-2">Filename: {doc.filename}</p>
                            <div className="flex items-center gap-4 text-xs text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <HardDrive className="h-3 w-3" />
                                {formatFileSize(doc.size)}
                              </span>
                              <span className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {new Date(doc.uploadDate).toLocaleDateString()}
                              </span>
                              {doc.classification && (
                                  <Badge variant="secondary" className="text-xs">
                                    {doc.classification}
                                  </Badge>
                              )}
                            </div>
                          </div>
                          <Badge variant="outline">
                            {formatFileType(doc.type)}
                          </Badge>
                        </div>
                      </div>
                  ))}
                </div>
              </CardContent>
            </Card>
        )}

        {/* Document Viewer */}
        {selectedDocument && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>{selectedDocument.title || selectedDocument.filename}</CardTitle>
                  <CardDescription>
                    {hasSearched && trimmedQuery
                        ? "Search terms are highlighted in yellow"
                        : "Document content preview"}
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDownload(selectedDocument)}
                  >
                    <Download className="h-4 w-4 mr-1" />
                    Download
                  </Button>
                  <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedDocument(null)}
                  >
                    Close
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div
                    className="prose max-w-none text-sm leading-relaxed whitespace-pre-wrap border rounded p-4 bg-muted/30 dark:bg-muted/10 max-h-96 overflow-y-auto"
                    dangerouslySetInnerHTML={{
                      __html: highlightText(selectedDocument.content, trimmedQuery)
                    }}
                />
              </CardContent>
            </Card>
        )}

        {/* No Results */}
        {hasSearched && searchResults.length === 0 && (
            <Card>
              <CardContent className="text-center py-8">
                <Search className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium text-foreground mb-2">No Results Found</h3>
                <p className="text-muted-foreground">
                  No documents match your search criteria. Try using different keywords or check your spelling.
                </p>
              </CardContent>
            </Card>
        )}

        {documents.length === 0 && (
            <Card>
              <CardContent className="text-center py-8">
                <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium text-foreground mb-2">No Documents Available</h3>
                <p className="text-muted-foreground">
                  Upload your first document to get started with analysis.
                </p>
              </CardContent>
            </Card>
        )}
      </div>
  );
};

export default DocumentSearch;
