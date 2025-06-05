
import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Cloud, Server, Cpu, HardDrive } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface SystemInfo {
  totalDocuments: number;
  totalStorage: number;
  cpuUsage: number;
  memoryUsage: number;
  uptime: string;
  lastSync: Date;
  searchQueries: number;
  averageSearchTime: number;
}

export const SystemStats = () => {
  const [systemInfo, setSystemInfo] = useState<SystemInfo>({
    totalDocuments: 0,
    totalStorage: 0,
    cpuUsage: 45,
    memoryUsage: 67,
    uptime: "2d 14h 32m",
    lastSync: new Date(),
    searchQueries: 0,
    averageSearchTime: 0
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    updateStats();
    
    // Set up real-time subscriptions
    const documentsChannel = supabase
      .channel('documents-stats')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'documents'
      }, () => {
        console.log('Documents changed, updating stats...');
        updateStats();
      })
      .subscribe();

    const searchChannel = supabase
      .channel('search-stats')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'search_logs'
      }, () => {
        console.log('New search logged, updating stats...');
        updateStats();
      })
      .subscribe();

    // Update stats every 10 seconds for dynamic metrics
    const interval = setInterval(() => {
      updateStats();
    }, 10000);
    
    return () => {
      clearInterval(interval);
      supabase.removeChannel(documentsChannel);
      supabase.removeChannel(searchChannel);
    };
  }, []);

  const updateStats = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setIsLoading(false);
        return;
      }

      // Get document count and total size
      const { data: documents, error: docError } = await supabase
        .from('documents')
        .select('size')
        .eq('user_id', user.id);

      if (docError) throw docError;

      const totalStorage = documents.reduce((sum, doc) => sum + (doc.size || 0), 0);

      // Get search statistics for last 24 hours
      const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      const { data: searches, error: searchError } = await supabase
        .from('search_logs')
        .select('search_time_ms')
        .eq('user_id', user.id)
        .gte('created_at', twentyFourHoursAgo);

      if (searchError) throw searchError;

      const averageSearchTime = searches.length > 0 
        ? searches.reduce((sum, search) => sum + search.search_time_ms, 0) / searches.length 
        : 0;
      
      // Simulate some dynamic CPU and memory usage
      const cpuUsage = 35 + Math.random() * 30; // 35-65%
      const memoryUsage = 50 + Math.random() * 30; // 50-80%
      
      setSystemInfo(prev => ({
        ...prev,
        totalDocuments: documents.length,
        totalStorage,
        lastSync: new Date(),
        searchQueries: searches.length,
        averageSearchTime,
        cpuUsage: Math.round(cpuUsage),
        memoryUsage: Math.round(memoryUsage)
      }));
      
      setIsLoading(false);
    } catch (error) {
      console.error('Error updating stats:', error);
      setIsLoading(false);
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  if (isLoading) {
    return (
      <Card className="p-4 bg-blue-50/50 border-blue-200">
        <div className="text-center">Loading system stats...</div>
      </Card>
    );
  }

  return (
    <Card className="p-4 bg-blue-50/50 border-blue-200">
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2">
          <Cloud className="h-5 w-5 text-blue-600" />
          <div className="text-sm">
            <div className="font-semibold text-gray-900">{systemInfo.totalDocuments}</div>
            <div className="text-gray-600">Documents</div>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <HardDrive className="h-5 w-5 text-green-600" />
          <div className="text-sm">
            <div className="font-semibold text-gray-900">{formatBytes(systemInfo.totalStorage)}</div>
            <div className="text-gray-600">Storage</div>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Server className="h-5 w-5 text-purple-600" />
          <div className="text-sm">
            <div className="font-semibold text-gray-900">{systemInfo.searchQueries}</div>
            <div className="text-gray-600">Searches (24h)</div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Cpu className="h-5 w-5 text-orange-600" />
          <div className="text-sm">
            <div className="font-semibold text-gray-900">{systemInfo.averageSearchTime.toFixed(0)}ms</div>
            <div className="text-gray-600">Avg Search</div>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="bg-green-100 text-green-800">
            <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
            Online
          </Badge>
        </div>

        <div className="text-xs text-gray-500">
          Last sync: {systemInfo.lastSync.toLocaleTimeString()}
        </div>
      </div>
    </Card>
  );
};
