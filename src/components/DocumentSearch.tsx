
import { useState, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, FileText, Clock, Filter } from "lucide-react";
import { Document } from "@/utils/types";

interface DocumentSearchProps {
  documents: Document[];
  onSearchResults: (results: Document[]) => void;
}

const DocumentSearch = ({ documents, onSearchResults }: DocumentSearchProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Document[]>([]);
  const [searchTime, setSearchTime] = useState<number>(0);
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);

  const highlightText = (text: string, query: string): string => {
    if (!query.trim()) return text;
    
    const keywords = query.toLowerCase().split(/\s+/).filter(word => word.length > 0);
    let highlightedText = text;
    
    keywords.forEach(keyword => {
      const regex = new RegExp(`(${keyword})`, 'gi');
      highlightedText = highlightedText.replace(regex, '<mark class="bg-yellow-200 px-1 rounded">$1</mark>');
    });
    
    return highlightedText;
  };

  const searchDocuments = () => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      onSearchResults([]);
      return;
    }

    const startTime = performance.now();
    
    const keywords = searchQuery.toLowerCase().split(/\s+/).filter(word => word.length > 0);
    
    const results = documents.filter(doc => {
      const searchableText = `${doc.title} ${doc.content} ${doc.filename}`.toLowerCase();
      return keywords.some(keyword => searchableText.includes(keyword));
    });

    // Sort by relevance (number of keyword matches)
    results.sort((a, b) => {
      const aText = `${a.title} ${a.content} ${a.filename}`.toLowerCase();
      const bText = `${b.title} ${b.content} ${b.filename}`.toLowerCase();
      
      const aMatches = keywords.reduce((count, keyword) => {
        return count + (aText.match(new RegExp(keyword, 'g')) || []).length;
      }, 0);
      
      const bMatches = keywords.reduce((count, keyword) => {
        return count + (bText.match(new RegExp(keyword, 'g')) || []).length;
      }, 0);
      
      return bMatches - aMatches;
    });

    const endTime = performance.now();
    setSearchTime(endTime - startTime);
    setSearchResults(results);
    onSearchResults(results);
    setSelectedDocument(null);
    
    console.log(`Search completed in ${(endTime - startTime).toFixed(2)}ms, found ${results.length} results`);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      searchDocuments();
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

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-6">
      {/* Search Interface */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Document Search
          </CardTitle>
          <CardDescription>
            Search through your document collection using keywords and phrases
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="Enter keywords to search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={handleKeyPress}
              className="flex-1"
            />
            <Button onClick={searchDocuments} disabled={!searchQuery.trim()}>
              <Search className="h-4 w-4 mr-2" />
              Search
            </Button>
          </div>

          {/* Search Stats */}
          <div className="flex flex-wrap gap-4 text-sm text-gray-600">
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
            {searchResults.length > 0 && (
              <div className="flex items-center gap-1">
                <Filter className="h-4 w-4" />
                <span>{searchResults.length} results found</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Search Results */}
      {searchResults.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Search Results ({searchResults.length})</CardTitle>
            <CardDescription>
              Click on a document to view its content with highlighted search terms
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {searchResults.map((doc) => (
                <div
                  key={doc.id}
                  className="p-4 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                  onClick={() => setSelectedDocument(doc)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900 mb-1">{doc.title}</h4>
                      <p className="text-sm text-gray-600 mb-2">{doc.filename}</p>
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <span>{formatFileSize(doc.size)}</span>
                        <span>{doc.uploadDate.toLocaleDateString()}</span>
                        {doc.classification && (
                          <Badge variant="secondary" className="text-xs">
                            {doc.classification}
                          </Badge>
                        )}
                      </div>
                    </div>
                    <Badge variant="outline">
                      {doc.type.toUpperCase()}
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
          <CardHeader>
            <CardTitle>Document Content</CardTitle>
            <CardDescription>
              {selectedDocument.title} - Search terms are highlighted in yellow
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div 
              className="prose max-w-none text-sm leading-relaxed whitespace-pre-wrap border rounded p-4 bg-gray-50 max-h-96 overflow-y-auto"
              dangerouslySetInnerHTML={{
                __html: highlightText(selectedDocument.content, searchQuery)
              }}
            />
          </CardContent>
        </Card>
      )}

      {/* No Results */}
      {searchQuery && searchResults.length === 0 && searchTime > 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <Search className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Results Found</h3>
            <p className="text-gray-600">
              No documents match your search criteria. Try using different keywords or check your spelling.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default DocumentSearch;
