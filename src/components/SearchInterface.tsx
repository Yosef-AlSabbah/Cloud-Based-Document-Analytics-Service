
import { useState, useEffect, useRef } from "react";
import { Search, Filter, X, FileText, RefreshCw, Clock } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { DocumentList } from "@/components/DocumentList";

interface SearchInterfaceProps {
  onSearch: (query: string, filters: SearchFilters) => void;
  searchQuery: string;
  filters: SearchFilters;
}

interface SearchFilters {
  category: string;
  fileType: string;
  dateRange: string;
}

interface SearchResult {
  id: string;
  title: string;
  filename: string;
  content: string;
  type: string;
  size: number;
  created_at: string;
  classification?: string;
  confidence?: number;
  matches?: number;
  score?: number;
}

const SearchInterface = ({ onSearch, searchQuery, filters }: SearchInterfaceProps) => {
  const [localQuery, setLocalQuery] = useState(searchQuery);
  const [localFilters, setLocalFilters] = useState(filters || { category: 'all', fileType: 'all', dateRange: 'all' });
  const [showFilters, setShowFilters] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searchTime, setSearchTime] = useState(0);

  // Search configuration constants
  const MIN_LENGTH = 3;
  const MAX_LENGTH = 100;

  // Ref to store the timeout ID so we can clear it if needed
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Effect that runs whenever localQuery or localFilters change
  useEffect(() => {
    // Clear any existing timeout to cancel previous search trigger
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    const trimmedQuery = localQuery.trim();

    // Only proceed if search term has at least 3 characters and is within max length
    if (trimmedQuery.length >= MIN_LENGTH && trimmedQuery.length <= MAX_LENGTH) {
      // Set loading state to true to show user that search will happen
      setIsSearching(true);
      
      // Set a new timeout for 500ms
      debounceTimeoutRef.current = setTimeout(() => {
        // This function will execute after 500ms of no typing
        performSearch(trimmedQuery, localFilters);
      }, 500);
    } else {
      // If less than 3 characters or too long, clear results and loading state
      setSearchResults([]);
      setIsSearching(false);
      setSearchTime(0);
      onSearch('', localFilters);
    }

    // Cleanup function: clear timeout when component unmounts or effect re-runs
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, [localQuery, localFilters]); // Effect depends on localQuery and localFilters

  // Sync with parent props when they change
  useEffect(() => {
    setLocalQuery(searchQuery);
  }, [searchQuery]);

  useEffect(() => {
    setLocalFilters(filters || { category: 'all', fileType: 'all', dateRange: 'all' });
  }, [filters]);

  // Calculate actual relevance score using TF-IDF-like approach
  const calculateRelevanceScore = (text: string, query: string): { matches: number; score: number } => {
    if (!query.trim()) return { matches: 0, score: 0 };
    
    const normalizedText = text.toLowerCase();
    const normalizedQuery = query.toLowerCase();
    const queryTerms = normalizedQuery.split(/\s+/).filter(term => term.length > 0);
    
    let totalMatches = 0;
    let scoreComponents: number[] = [];
    
    queryTerms.forEach(term => {
      // Count exact matches
      const exactMatches = (normalizedText.match(new RegExp(term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) || []).length;
      totalMatches += exactMatches;
      
      // Calculate term frequency (TF)
      const tf = exactMatches / (normalizedText.split(/\s+/).length || 1);
      
      // Simple inverse document frequency approximation
      const termLength = term.length;
      const idf = Math.log(1 + (10 / Math.max(1, termLength - 2))); // Longer terms get higher IDF
      
      // Position bonus (earlier matches get higher score)
      const firstOccurrence = normalizedText.indexOf(term);
      const positionBonus = firstOccurrence >= 0 ? (1 - (firstOccurrence / normalizedText.length)) * 0.3 : 0;
      
      // Title bonus if the match is in title
      const titleBonus = normalizedText.includes(term) ? 0.2 : 0;
      
      scoreComponents.push((tf * idf) + positionBonus + titleBonus);
    });
    
    // Final score calculation
    const rawScore = scoreComponents.reduce((sum, component) => sum + component, 0);
    const normalizedScore = Math.min(rawScore, 1); // Cap at 1
    
    return { 
      matches: totalMatches, 
      score: parseFloat(normalizedScore.toFixed(3))
    };
  };

  // Highlight matching text with proper dark mode support
  const highlightText = (text: string, query: string) => {
    if (!query.trim()) return text;
    
    const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    const parts = text.split(regex);
    
    return parts.map((part, index) => 
      regex.test(part) ? (
        <mark key={index} className="bg-yellow-300 text-black dark:bg-yellow-500 dark:text-black rounded px-1">
          {part}
        </mark>
      ) : part
    );
  };

  // Format file type to human-readable format
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

  // Function that performs the actual search
  const performSearch = async (query: string, searchFilters: SearchFilters) => {
    const startTime = performance.now();
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.error('User not authenticated for search');
        setIsSearching(false);
        return;
      }

      // Build the search query with case-insensitive search
      let searchQuery = supabase
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
        .eq('user_id', user.id);

      // Add text search (case-insensitive) with trimmed query
      const trimmedQuery = query.trim();
      if (trimmedQuery) {
        searchQuery = searchQuery.or(`title.ilike.%${trimmedQuery}%,content.ilike.%${trimmedQuery}%,name.ilike.%${trimmedQuery}%`);
      }

      // Add category filter
      if (searchFilters.category && searchFilters.category !== 'all') {
        searchQuery = searchQuery.eq('document_classifications.category', searchFilters.category);
      }

      // Add file type filter
      if (searchFilters.fileType && searchFilters.fileType !== 'all') {
        const mimeTypes = {
          'pdf': 'application/pdf',
          'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'doc': 'application/msword',
          'txt': 'text/plain'
        };
        const mimeType = mimeTypes[searchFilters.fileType as keyof typeof mimeTypes] || searchFilters.fileType;
        searchQuery = searchQuery.eq('type', mimeType);
      }

      // Add date range filter
      if (searchFilters.dateRange && searchFilters.dateRange !== 'all') {
        const now = new Date();
        let startDate = new Date();
        
        switch (searchFilters.dateRange) {
          case 'today':
            startDate.setHours(0, 0, 0, 0);
            break;
          case 'week':
            startDate.setDate(now.getDate() - 7);
            break;
          case 'month':
            startDate.setMonth(now.getMonth() - 1);
            break;
          case 'year':
            startDate.setFullYear(now.getFullYear() - 1);
            break;
        }
        
        searchQuery = searchQuery.gte('created_at', startDate.toISOString());
      }

      const { data: results, error } = await searchQuery.order('created_at', { ascending: false });

      if (error) {
        console.error('Search error:', error);
        setIsSearching(false);
        return;
      }

      const endTime = performance.now();
      const searchTimeMs = endTime - startTime;

      console.log(`Search completed successfully in ${searchTimeMs.toFixed(2)}ms, found ${results?.length || 0} results`);

      // Transform results for display with proper relevance scoring
      const uniqueResultsMap = new Map<string, SearchResult>();
      (results || []).forEach(doc => {
        if (!uniqueResultsMap.has(doc.id)) {
          const searchableText = `${doc.title || doc.name || ''} ${doc.content || ''}`;
          const { matches, score } = calculateRelevanceScore(searchableText, trimmedQuery);
          
          uniqueResultsMap.set(doc.id, {
            id: doc.id,
            title: doc.title || doc.name || 'Untitled Document',
            filename: doc.name,
            content: doc.content || '',
            type: doc.type,
            size: doc.size,
            created_at: doc.created_at,
            classification: doc.document_classifications?.length > 0 
              ? doc.document_classifications[0].category 
              : undefined,
            confidence: doc.document_classifications?.length > 0 
              ? doc.document_classifications[0].confidence 
              : undefined,
            matches,
            score
          });
        }
      });

      const uniqueResults = Array.from(uniqueResultsMap.values())
        .sort((a, b) => (b.score || 0) - (a.score || 0)); // Sort by relevance score

      setSearchResults(uniqueResults);
      setSearchTime(Math.round(searchTimeMs));
      setIsSearching(false);

      // Log search activity
      if (trimmedQuery.length > 0) {
        await supabase.from('search_logs').insert({
          query: trimmedQuery,
          results_count: uniqueResults.length,
          search_time_ms: Math.round(searchTimeMs),
          user_id: user.id
        });
      }

      // Call parent callback
      onSearch(trimmedQuery, searchFilters);
      
    } catch (error) {
      console.error('Search error:', error);
      setIsSearching(false);
    }
  };

  const handleManualSearch = async () => {
    const trimmedQuery = localQuery.trim();
    if (trimmedQuery.length < MIN_LENGTH || trimmedQuery.length > MAX_LENGTH) return;
    
    setIsSearching(true);
    console.log('Manual search triggered:', { query: trimmedQuery, localFilters });
    await performSearch(trimmedQuery, localFilters);
  };

  const clearFilters = () => {
    const emptyFilters = { category: 'all', fileType: 'all', dateRange: 'all' };
    setLocalFilters(emptyFilters);
    onSearch(localQuery.trim(), emptyFilters);
  };

  const hasActiveFilters = Object.values(localFilters).some(value => value !== 'all');
  const trimmedQuery = localQuery.trim();
  const isValidQuery = trimmedQuery.length >= MIN_LENGTH && trimmedQuery.length <= MAX_LENGTH;

  return (
    <div className="space-y-6">
      {/* Search Input */}
      <Card className="glass-card border-border/50">
        <CardContent className="p-6 space-y-4">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Type at least 3 characters to search..."
                value={localQuery}
                onChange={(e) => setLocalQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleManualSearch()}
                className="pl-10 bg-background border-border text-foreground placeholder:text-muted-foreground focus:ring-primary focus:border-primary"
                disabled={isSearching}
                maxLength={MAX_LENGTH}
              />
              {isSearching && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                </div>
              )}
            </div>
            <Button 
              onClick={handleManualSearch}
              disabled={isSearching || !isValidQuery}
              className="bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              Search
            </Button>
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className="border-border text-foreground hover:bg-accent hover:text-accent-foreground"
            >
              <Filter className="h-4 w-4" />
            </Button>
          </div>

          {/* Character count and search status */}
          <div className="flex justify-between items-center text-xs text-muted-foreground">
            <span>
              {trimmedQuery.length > 0 && trimmedQuery.length < MIN_LENGTH && (
                `Type ${MIN_LENGTH - trimmedQuery.length} more character(s) to start searching...`
              )}
              {trimmedQuery.length >= MIN_LENGTH && isSearching && (
                `Searching in 500ms... (type more to reset timer)`
              )}
              {trimmedQuery.length > MAX_LENGTH && (
                `Query too long (${trimmedQuery.length}/${MAX_LENGTH})`
              )}
              {isValidQuery && !isSearching && (
                "Ready to search"
              )}
            </span>
            <span>{trimmedQuery.length}/{MAX_LENGTH}</span>
          </div>

          {/* Active Filters */}
          {hasActiveFilters && (
            <div className="flex flex-wrap gap-2 items-center">
              <span className="text-sm text-muted-foreground">Active filters:</span>
              {localFilters.category !== 'all' && (
                <Badge variant="secondary" className="bg-secondary text-secondary-foreground">
                  Category: {localFilters.category}
                </Badge>
              )}
              {localFilters.fileType !== 'all' && (
                <Badge variant="secondary" className="bg-secondary text-secondary-foreground">
                  Type: {localFilters.fileType.toUpperCase()}
                </Badge>
              )}
              {localFilters.dateRange !== 'all' && (
                <Badge variant="secondary" className="bg-secondary text-secondary-foreground">
                  Date: {localFilters.dateRange}
                </Badge>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                className="text-muted-foreground hover:text-foreground hover:bg-accent"
              >
                <X className="h-3 w-3 mr-1" />
                Clear
              </Button>
            </div>
          )}

          {/* Filter Panel */}
          {showFilters && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-muted/30 rounded-lg border border-border">
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">Category</label>
                <Select
                  value={localFilters.category}
                  onValueChange={(value) => setLocalFilters(prev => ({ ...prev, category: value }))}
                >
                  <SelectTrigger className="bg-background border-border text-foreground">
                    <SelectValue placeholder="All categories" />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border-border">
                    <SelectItem value="all" className="text-popover-foreground">All categories</SelectItem>
                    <SelectItem value="Business & Finance" className="text-popover-foreground">Business & Finance</SelectItem>
                    <SelectItem value="Technology" className="text-popover-foreground">Technology</SelectItem>
                    <SelectItem value="Research & Academic" className="text-popover-foreground">Research & Academic</SelectItem>
                    <SelectItem value="Legal & Compliance" className="text-popover-foreground">Legal & Compliance</SelectItem>
                    <SelectItem value="General" className="text-popover-foreground">General</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">File Type</label>
                <Select
                  value={localFilters.fileType}
                  onValueChange={(value) => setLocalFilters(prev => ({ ...prev, fileType: value }))}
                >
                  <SelectTrigger className="bg-background border-border text-foreground">
                    <SelectValue placeholder="All types" />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border-border">
                    <SelectItem value="all" className="text-popover-foreground">All types</SelectItem>
                    <SelectItem value="pdf" className="text-popover-foreground">PDF</SelectItem>
                    <SelectItem value="docx" className="text-popover-foreground">Word Document</SelectItem>
                    <SelectItem value="doc" className="text-popover-foreground">Word Document (Legacy)</SelectItem>
                    <SelectItem value="txt" className="text-popover-foreground">Text File</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">Date Range</label>
                <Select
                  value={localFilters.dateRange}
                  onValueChange={(value) => setLocalFilters(prev => ({ ...prev, dateRange: value }))}
                >
                  <SelectTrigger className="bg-background border-border text-foreground">
                    <SelectValue placeholder="All time" />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border-border">
                    <SelectItem value="all" className="text-popover-foreground">All time</SelectItem>
                    <SelectItem value="today" className="text-popover-foreground">Today</SelectItem>
                    <SelectItem value="week" className="text-popover-foreground">This week</SelectItem>
                    <SelectItem value="month" className="text-popover-foreground">This month</SelectItem>
                    <SelectItem value="year" className="text-popover-foreground">This year</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Search Results Container */}
      <div className="glass-card border-border/50 rounded-lg border bg-card text-card-foreground shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold flex items-center text-foreground">
            <Search className="h-5 w-5 mr-2 text-primary" />
            {isValidQuery && trimmedQuery ? `Search Results for "${trimmedQuery}"` : "Search Results"}
          </h3>
          <div className="flex gap-2">
            <div className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold bg-secondary text-secondary-foreground border-border">
              {searchResults.length} results
            </div>
            {searchTime > 0 && (
              <div className="rounded-full border px-2.5 py-0.5 text-xs font-semibold bg-secondary text-secondary-foreground flex items-center gap-1 border-border">
                <Clock className="h-3 w-3" />
                {searchTime}ms
              </div>
            )}
          </div>
        </div>

        <div className="space-y-4">
          {isValidQuery && trimmedQuery && searchResults.length > 0 ? (
            searchResults.map((doc) => (
              <div key={doc.id} className="glass-card rounded-lg border bg-card text-card-foreground shadow-sm p-4 hover:shadow-md transition-shadow card-animate border-l-4 border-l-primary">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <FileText className="h-5 w-5 text-primary" />
                      <h4 className="font-semibold text-foreground">
                        {highlightText(doc.title, trimmedQuery)}
                      </h4>
                      <div className="inline-flex items-center rounded-full border px-2.5 py-0.5 font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 text-foreground text-xs border-border">
                        File: {doc.filename}
                      </div>
                      <div className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80">
                        {doc.matches || 0} matches
                      </div>
                      <div className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-primary text-primary-foreground hover:bg-primary/80">
                        Score: {doc.score || 0}
                      </div>
                    </div>
                    {doc.content && (
                      <p className="text-sm text-muted-foreground mb-2">
                        {highlightText(doc.content.substring(0, 200) + (doc.content.length > 200 ? '...' : ''), trimmedQuery)}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))
          ) : isValidQuery && trimmedQuery && searchResults.length === 0 && !isSearching ? (
            <div className="text-center py-8">
              <Search className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">No Results Found</h3>
              <p className="text-muted-foreground">
                No documents match your search criteria for "{trimmedQuery}". Try using different keywords or check your spelling.
              </p>
            </div>
          ) : !isValidQuery && trimmedQuery.length > 0 ? (
            <div className="text-center py-8">
              <Search className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">Start Typing</h3>
              <p className="text-muted-foreground">
                Enter at least {MIN_LENGTH} characters to start searching your documents.
              </p>
            </div>
          ) : (
            <div className="text-center py-8">
              <Search className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">Ready to Find Something?</h3>
              <p className="text-muted-foreground">
                Start typing to search through your document library. Need at least {MIN_LENGTH} characters to begin.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* All Documents Section */}
      <DocumentList />
    </div>
  );
};

export default SearchInterface;
