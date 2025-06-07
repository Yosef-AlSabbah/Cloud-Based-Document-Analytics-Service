
import { useState, useEffect } from "react";
import { Search, Filter, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

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

const SearchInterface = ({ onSearch, searchQuery, filters }: SearchInterfaceProps) => {
  const [localQuery, setLocalQuery] = useState(searchQuery);
  const [localFilters, setLocalFilters] = useState(filters || { category: '', fileType: '', dateRange: '' });
  const [showFilters, setShowFilters] = useState(false);

  // Auto-search when user types 3+ characters
  useEffect(() => {
    if (localQuery.length >= 3) {
      const debounceTimer = setTimeout(() => {
        console.log('Auto-searching with query:', localQuery);
        onSearch(localQuery, localFilters);
      }, 300); // 300ms debounce

      return () => clearTimeout(debounceTimer);
    } else if (localQuery.length === 0) {
      // Clear search when query is empty
      console.log('Clearing search results');
      onSearch('', localFilters);
    }
  }, [localQuery, localFilters, onSearch]);

  // Sync with parent props when they change
  useEffect(() => {
    setLocalQuery(searchQuery);
  }, [searchQuery]);

  useEffect(() => {
    setLocalFilters(filters || { category: '', fileType: '', dateRange: '' });
  }, [filters]);

  const handleSearch = () => {
    console.log('Manual search triggered:', { localQuery, localFilters });
    onSearch(localQuery, localFilters);
  };

  const clearFilters = () => {
    const emptyFilters = { category: '', fileType: '', dateRange: '' };
    setLocalFilters(emptyFilters);
    onSearch(localQuery, emptyFilters);
  };

  const hasActiveFilters = Object.values(localFilters).some(value => value !== '');

  return (
    <Card className="glass-card border-border/50">
      <CardContent className="p-6 space-y-4">
        {/* Search Input */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search documents... (type 3+ characters for auto-search)"
              value={localQuery}
              onChange={(e) => {
                console.log('Search input changed:', e.target.value);
                setLocalQuery(e.target.value);
              }}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              className="pl-10 bg-background border-border text-foreground placeholder:text-muted-foreground focus:ring-primary focus:border-primary"
            />
          </div>
          <Button 
            onClick={handleSearch}
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

        {/* Auto-search indicator */}
        {localQuery.length > 0 && localQuery.length < 3 && (
          <div className="text-sm text-muted-foreground">
            Type {3 - localQuery.length} more character{3 - localQuery.length !== 1 ? 's' : ''} for auto-search
          </div>
        )}

        {/* Active Filters */}
        {hasActiveFilters && (
          <div className="flex flex-wrap gap-2 items-center">
            <span className="text-sm text-muted-foreground">Active filters:</span>
            {localFilters.category && (
              <Badge variant="secondary" className="bg-secondary text-secondary-foreground">
                Category: {localFilters.category}
              </Badge>
            )}
            {localFilters.fileType && (
              <Badge variant="secondary" className="bg-secondary text-secondary-foreground">
                Type: {localFilters.fileType}
              </Badge>
            )}
            {localFilters.dateRange && (
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
                  <SelectItem value="" className="text-popover-foreground">All categories</SelectItem>
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
                  <SelectItem value="" className="text-popover-foreground">All types</SelectItem>
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
                  <SelectItem value="" className="text-popover-foreground">All time</SelectItem>
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
  );
};

export default SearchInterface;
