import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, SortAsc, SortDesc, FileText, Clock, Highlighter } from "lucide-react";
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

interface SearchResult extends Document {
  relevanceScore: number;
  highlightedContent?: string;
  matchCount: number;
}

export const SearchInterface = () => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"title" | "relevance" | "date">("relevance");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [isSearching, setIsSearching] = useState(false);
  const [searchTime, setSearchTime] = useState<number>(0);
  const [minCharsToSearch] = useState<number>(3); // Explicitly define min chars needed to search
  const { toast } = useToast();

  useEffect(() => {
    loadDocuments();
    
    // Set up real-time subscription for documents
    const channel = supabase
      .channel('search-documents-changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'documents'
      }, (payload) => {
        console.log('Real-time document change in search:', payload);
        loadDocuments();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Re-run search when sort options change
  useEffect(() => {
    if (searchQuery.trim().length >= minCharsToSearch && searchResults.length > 0) {
      sortResults();
    }
  }, [sortBy, sortOrder]);

  // Enhanced search functionality with proper debouncing and minimum character requirement
  useEffect(() => {
    // Clear any existing timeout to prevent multiple searches
    const timeoutId = setTimeout(() => {
      if (searchQuery.trim().length >= minCharsToSearch) {
        console.log(`🔍 Search debounce complete, searching for: "${searchQuery}"`);
        performSearch();
      } else if (searchQuery.trim().length === 0) {
        // Reset search results when query is cleared
        setSearchResults([]);
        setSearchTime(0);
        setIsSearching(false);
      }
    }, 500); // 500ms debounce time

    return () => {
      clearTimeout(timeoutId);
    };
  }, [searchQuery, documents, minCharsToSearch]); // Added minCharsToSearch as dependency

  const loadDocuments = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Authentication Required",
          description: "Please log in to search documents",
          variant: "destructive",
        });
        return;
      }

      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .eq('user_id', user.id)
        .order('upload_time', { ascending: false });

      if (error) throw error;
      
      console.log(`📚 Loaded ${data?.length || 0} documents for search`);
      setDocuments(data || []);
    } catch (error) {
      console.error('Error loading documents:', error);
      toast({
        title: "Error",
        description: "Failed to load documents",
        variant: "destructive",
      });
    }
  };

  const highlightText = (text: string, query: string): string => {
    if (!query.trim()) return text;
    
    const keywords = query.toLowerCase().split(/\s+/).filter(word => word.length > 0);
    let highlighted = text;
    
    keywords.forEach(keyword => {
      const regex = new RegExp(`(${keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
      highlighted = highlighted.replace(regex, '<mark class="bg-yellow-200 px-1 rounded font-medium">$1</mark>');
    });
    
    return highlighted;
  };

  const calculateRelevance = (doc: Document, query: string): { score: number; matchCount: number } => {
    const keywords = query.toLowerCase().split(/\s+/).filter(word => word.length > 2);
    let score = 0;
    let matchCount = 0;

    // Use extracted title if available, fallback to filename
    const title = (doc.title && doc.title.trim() !== '' ? doc.title : doc.name).toLowerCase();
    const content = (doc.content || '').toLowerCase();

    keywords.forEach(keyword => {
      const escapedKeyword = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      
      // Title matches are weighted more heavily
      const titleMatches = (title.match(new RegExp(`\\b${escapedKeyword}`, 'g')) || []).length;
      const exactTitleMatches = (title.match(new RegExp(`\\b${escapedKeyword}\\b`, 'g')) || []).length;
      
      // Content matches
      const contentMatches = (content.match(new RegExp(`\\b${escapedKeyword}`, 'g')) || []).length;
      const exactContentMatches = (content.match(new RegExp(`\\b${escapedKeyword}\\b`, 'g')) || []).length;
      
      // Enhanced scoring: exact matches in title are most valuable
      score += exactTitleMatches * 20 + titleMatches * 10 + exactContentMatches * 5 + contentMatches * 1;
      matchCount += titleMatches + contentMatches;
    });

    return { score, matchCount };
  };

  const sortResults = () => {
    const sorted = [...searchResults].sort((a, b) => {
      switch (sortBy) {
        case "title":
          // Use extracted title if available, fallback to filename
          const titleA = (a.title && a.title.trim() !== '' ? a.title : a.name).toLowerCase();
          const titleB = (b.title && b.title.trim() !== '' ? b.title : b.name).toLowerCase();
          
          // Smart title sorting with chapter detection
          const chapterA = titleA.match(/(?:chapter|ch\.?)\s*(\d+)/i);
          const chapterB = titleB.match(/(?:chapter|ch\.?)\s*(\d+)/i);
          
          if (chapterA && chapterB) {
            const numA = parseInt(chapterA[1], 10);
            const numB = parseInt(chapterB[1], 10);
            if (numA !== numB) {
              return sortOrder === "asc" ? numA - numB : numB - numA;
            }
          }
          
          // Also check for numeric patterns at the beginning
          const numRegexA = titleA.match(/^(\d+)/);
          const numRegexB = titleB.match(/^(\d+)/);
          
          if (numRegexA && numRegexB) {
            const numA = parseInt(numRegexA[1], 10);
            const numB = parseInt(numRegexB[1], 10);
            
            if (numA !== numB) {
              return sortOrder === "asc" ? numA - numB : numB - numA;
            }
          }
          
          return sortOrder === "asc"
            ? titleA.localeCompare(titleB)
            : titleB.localeCompare(titleA);
            
        case "date":
          const dateA = new Date(a.upload_time).getTime();
          const dateB = new Date(b.upload_time).getTime();
          return sortOrder === "asc" 
            ? dateA - dateB
            : dateB - dateA;
            
        case "relevance":
        default:
          return sortOrder === "asc" 
            ? a.relevanceScore - b.relevanceScore
            : b.relevanceScore - a.relevanceScore;
      }
    });
    setSearchResults(sorted);
  };

  const performSearch = async () => {
    if (!searchQuery.trim() || searchQuery.trim().length < minCharsToSearch) {
      setSearchResults([]);
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to perform searches",
        variant: "destructive",
      });
      return;
    }

    setIsSearching(true);
    const startTime = performance.now();

    try {
      console.log(`🔍 Searching for: "${searchQuery}"`);
      
      // Enhanced search that filters documents with any matches
      const results: SearchResult[] = [];
      
      documents.forEach(doc => {
        const { score, matchCount } = calculateRelevance(doc, searchQuery);
        
        if (score > 0) { // Only include documents with matches
          // Create highlighted content snippet
          let highlightedContent = '';
          if (doc.content) {
            const contentLower = doc.content.toLowerCase();
            const queryLower = searchQuery.toLowerCase();
            
            // Find the first occurrence of any search term
            const keywords = queryLower.split(/\s+/).filter(word => word.length > 2);
            let bestStartIndex = -1;
            
            for (const keyword of keywords) {
              const index = contentLower.indexOf(keyword);
              if (index !== -1 && (bestStartIndex === -1 || index < bestStartIndex)) {
                bestStartIndex = index;
              }
            }
            
            if (bestStartIndex !== -1) {
              const start = Math.max(0, bestStartIndex - 100);
              const end = Math.min(doc.content.length, bestStartIndex + 300);
              let snippet = doc.content.substring(start, end);
              
              if (start > 0) snippet = '...' + snippet;
              if (end < doc.content.length) snippet = snippet + '...';
              
              highlightedContent = highlightText(snippet, searchQuery);
            } else {
              // Fallback to first 300 characters if no keyword found
              const snippet = doc.content.substring(0, 300);
              highlightedContent = highlightText(snippet, searchQuery);
            }
          }
          
          results.push({
            ...doc,
            relevanceScore: score,
            matchCount,
            highlightedContent
          });
        }
      });

      console.log(`Found ${results.length} matching documents`);

      // Sort the results based on current sort settings
      const sortedResults = [...results].sort((a, b) => {
        switch (sortBy) {
          case "title":
            const titleA = (a.title && a.title.trim() !== '' ? a.title : a.name).toLowerCase();
            const titleB = (b.title && b.title.trim() !== '' ? b.title : b.name).toLowerCase();
            return sortOrder === "asc"
              ? titleA.localeCompare(titleB)
              : titleB.localeCompare(titleA);
          case "date":
            const dateA = new Date(a.upload_time).getTime();
            const dateB = new Date(b.upload_time).getTime();
            return sortOrder === "asc"
              ? dateA - dateB
              : dateB - dateA;
          case "relevance":
          default:
            return sortOrder === "asc"
              ? a.relevanceScore - b.relevanceScore
              : b.relevanceScore - a.relevanceScore;
        }
      });

      setSearchResults(sortedResults);

      const endTime = performance.now();
      const searchTimeMs = endTime - startTime;
      setSearchTime(searchTimeMs);

      // Log search to database (if results found)
      try {
        await supabase
          .from('search_logs')
          .insert({
            user_id: user.id,
            query: searchQuery,
            results_count: results.length,
            search_time_ms: Math.round(searchTimeMs)
          });
      } catch (logError) {
        console.warn('Failed to log search:', logError);
      }

      // Display toast for no results case
      if (results.length === 0) {
        toast({
          title: "No Results Found",
          description: `No documents matching "${searchQuery}" were found.`,
          variant: "default",
        });
      }

      console.log(`✅ Search completed: ${results.length} results in ${searchTimeMs.toFixed(0)}ms`);

    } catch (error) {
      console.error('Search error:', error);
      toast({
        title: "Search Failed",
        description: "There was an error performing the search",
        variant: "destructive",
      });
    } finally {
      setIsSearching(false);
    }
  };

  const sortAllDocuments = () => {
    console.log('🔤 Sorting all documents by title...');
    
    const sorted = [...documents].sort((a, b) => {
      // Use extracted title if available, fallback to filename
      const titleA = (a.title && a.title.trim() !== '' ? a.title : a.name).toLowerCase();
      const titleB = (b.title && b.title.trim() !== '' ? b.title : b.name).toLowerCase();

      console.log(`Comparing: "${titleA}" vs "${titleB}"`);

      // Enhanced chapter number detection
      const chapterRegexA = titleA.match(/(?:chapter|ch\.?)\s*(\d+)/i);
      const chapterRegexB = titleB.match(/(?:chapter|ch\.?)\s*(\d+)/i);

      // If both titles contain chapter numbers, sort by chapter number
      if (chapterRegexA && chapterRegexB) {
        const chapterA = parseInt(chapterRegexA[1], 10);
        const chapterB = parseInt(chapterRegexB[1], 10);

        console.log(`Found chapters: ${chapterA} vs ${chapterB}`);

        if (chapterA !== chapterB) {
          return sortOrder === "asc" ? chapterA - chapterB : chapterB - chapterA;
        }
      }

      // Also check for numeric patterns at the beginning
      const numRegexA = titleA.match(/^(\d+)/);
      const numRegexB = titleB.match(/^(\d+)/);
      
      if (numRegexA && numRegexB) {
        const numA = parseInt(numRegexA[1], 10);
        const numB = parseInt(numRegexB[1], 10);
        
        if (numA !== numB) {
          return sortOrder === "asc" ? numA - numB : numB - numA;
        }
      }

      // Standard lexicographical sorting
      return sortOrder === "asc"
        ? titleA.localeCompare(titleB)
        : titleB.localeCompare(titleA);
    });

    setDocuments(sorted);

    toast({
      title: "Documents Sorted",
      description: `${documents.length} documents sorted by title (${sortOrder === "asc" ? "A-Z" : "Z-A"})`,
    });
  };

  return (
    <div className="space-y-6">
      {/* Search Controls */}
      <Card className="p-6">
        <div className="space-y-4">
          <div className="flex gap-4">
            <div className="flex-1">
              <Input
                type="text"
                placeholder="Search documents by title or content (min 3 characters)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="text-lg"
              />
              {searchQuery.trim().length > 0 && searchQuery.trim().length < 3 && (
                <p className="text-sm text-gray-500 mt-1">
                  Type at least 3 characters to search
                </p>
              )}
            </div>
            <Button 
              onClick={performSearch}
              disabled={isSearching || !searchQuery.trim() || searchQuery.trim().length < 3}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Search className="h-4 w-4 mr-2" />
              {isSearching ? "Searching..." : "Search"}
            </Button>
          </div>

          <div className="flex gap-4 items-center flex-wrap">
            <div className="flex gap-2 items-center">
              <span className="text-sm text-gray-600">Sort by:</span>
              <Select value={sortBy} onValueChange={(value: "title" | "relevance" | "date") => setSortBy(value)}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="relevance">Relevance</SelectItem>
                  <SelectItem value="title">Title</SelectItem>
                  <SelectItem value="date">Date</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button
              variant="outline"
              onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
              className="flex items-center gap-2"
            >
              {sortOrder === "asc" ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />}
              {sortOrder === "asc" ? "Ascending" : "Descending"}
            </Button>

            <Button
              variant="outline"
              onClick={sortAllDocuments}
              className="flex items-center gap-2"
            >
              <FileText className="h-4 w-4" />
              Sort All by Title
            </Button>
          </div>
        </div>
      </Card>

      {/* Search Results */}
      {searchQuery.trim().length >= 3 && (
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold flex items-center">
              <Search className="h-5 w-5 mr-2" />
              Search Results for "{searchQuery}"
            </h3>
            <div className="flex gap-2">
              <Badge variant="secondary">
                {searchResults.length} results
              </Badge>
              {searchTime > 0 && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {searchTime.toFixed(0)}ms
                </Badge>
              )}
            </div>
          </div>

          {searchResults.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              {isSearching ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                  <span>Searching...</span>
                </div>
              ) : (
                "No documents found matching your search criteria"
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {searchResults.map((result) => (
                <Card key={result.id} className="p-4 border-l-4 border-l-blue-500">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <FileText className="h-5 w-5 text-blue-600" />
                        <h4 className="font-semibold text-gray-900">
                          {result.title && result.title.trim() !== '' ? result.title : result.name}
                        </h4>
                        {result.title && result.title.trim() !== '' && result.title !== result.name && (
                          <Badge variant="outline" className="text-xs">
                            File: {result.name}
                          </Badge>
                        )}
                        {(!result.title || result.title.trim() === '') && (
                          <Badge variant="destructive" className="text-xs">
                            Title not found
                          </Badge>
                        )}
                        <Badge variant="secondary">{result.matchCount} matches</Badge>
                        <Badge variant="default">Score: {result.relevanceScore}</Badge>
                      </div>
                      
                      {result.highlightedContent && (
                        <div className="mb-3 p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center gap-1 mb-2">
                            <Highlighter className="h-4 w-4 text-yellow-600" />
                            <span className="text-sm font-medium text-gray-700">Content preview:</span>
                          </div>
                          <div 
                            className="text-sm text-gray-600 leading-relaxed"
                            dangerouslySetInnerHTML={{ __html: result.highlightedContent }}
                          />
                        </div>
                      )}
                      
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <span>{(result.size / 1024 / 1024).toFixed(2)} MB</span>
                        <span>{new Date(result.upload_time).toLocaleDateString()}</span>
                        <span className="capitalize">{result.type.split('/')[1] || 'document'}</span>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </Card>
      )}

      {/* All Documents */}
      {!searchQuery && documents.length > 0 && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <FileText className="h-5 w-5 mr-2" />
            All Documents ({documents.length})
          </h3>
          <div className="grid gap-4">
            {documents.map((doc) => (
              <Card key={doc.id} className="p-4 border-l-4 border-l-gray-300">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <FileText className="h-8 w-8 text-gray-600" />
                    <div>
                      <h4 className="font-medium text-gray-900">
                        {doc.title && doc.title.trim() !== '' ? (
                          <>
                            <span className="font-semibold">{doc.title}</span>
                            {doc.title !== doc.name && (
                              <>
                                <span className="mx-2 text-gray-400">•</span>
                                <span className="text-sm text-gray-500">File: {doc.name}</span>
                              </>
                            )}
                          </>
                        ) : (
                          <>
                            <span>{doc.name}</span>
                            <span className="ml-2 text-xs text-red-500">(Title not found)</span>
                          </>
                        )}
                      </h4>
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <span>{(doc.size / 1024 / 1024).toFixed(2)} MB</span>
                        <span>{new Date(doc.upload_time).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
};
