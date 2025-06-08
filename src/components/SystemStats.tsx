
import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Cloud, Server, Cpu, HardDrive, Activity, Zap } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface SystemInfo {
  totalDocuments: number;
  totalStorage: number;
  cpuUsage: number;
  memoryUsage: number;
  uptime: string;
  lastSync: Date;
  searchQueries: number;
  averageSearchTime: number;
  isRealtime: boolean;
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
    averageSearchTime: 0,
    isRealtime: false
  });
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  
  // Random performance simulator for CPU/memory to create visual feedback
  const simulatePerformanceMetrics = () => {
    return {
      cpuUsage: 35 + Math.random() * 30, // 35-65%
      memoryUsage: 50 + Math.random() * 30 // 50-80%
    };
  };

  useEffect(() => {
    updateStats();
    
    // Set up real-time subscriptions
    const documentsChannel = supabase
      .channel('documents-stats-realtime')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'documents'
      }, (payload) => {
        console.log('Documents changed, updating system stats...', payload);
        updateStats();
        
        // Show toast notification
        let message = '';
        if (payload.eventType === 'INSERT') {
          message = 'New document added';
        } else if (payload.eventType === 'UPDATE') {
          message = 'Document updated';
        } else if (payload.eventType === 'DELETE') {
          message = 'Document deleted';
        }
        
        if (message) {
          toast({
            title: "System Update",
            description: message,
            duration: 3000
          });
        }
      })
      .subscribe((status) => {
        console.log('Documents stats channel status:', status);
        setSystemInfo(prev => ({...prev, isRealtime: status === 'SUBSCRIBED'}));
      });

    const searchChannel = supabase
      .channel('search-stats-realtime')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'search_logs'
      }, () => {
        console.log('New search logged, updating system stats...');
        updateStats();
        
        toast({
          title: "Search Activity",
          description: "New search query recorded",
          duration: 3000
        });
      })
      .subscribe();

    // Update stats every 10 seconds for dynamic metrics
    const interval = setInterval(() => {
      // Only update performance metrics, not DB stats
      const { cpuUsage, memoryUsage } = simulatePerformanceMetrics();
      setSystemInfo(prev => ({
        ...prev,
        lastSync: new Date(),
        cpuUsage: Math.round(cpuUsage),
        memoryUsage: Math.round(memoryUsage)
      }));
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
      
      // Calculate system uptime (simulated)
      const getUptime = () => {
        // Simulate an uptime by using a fixed start date
        const startDate = new Date('2025-06-01T00:00:00');
        const now = new Date();
        const diff = now.getTime() - startDate.getTime();
        
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        
        return `${days}d ${hours}h ${minutes}m`;
      };
      
      // Get performance metrics (simulated)
      const { cpuUsage, memoryUsage } = simulatePerformanceMetrics();
      
      setSystemInfo(prev => ({
        ...prev,
        totalDocuments: documents.length,
        totalStorage,
        lastSync: new Date(),
        searchQueries: searches.length,
        averageSearchTime,
        uptime: getUptime(),
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
      <Card className="p-6 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-0 shadow-xl animate-pulse">
        <div className="text-center text-muted-foreground">Loading system stats...</div>
      </Card>
    );
  }

  const stats = [
    {
      icon: Cloud,
      label: "Documents",
      value: systemInfo.totalDocuments.toString(),
      color: "text-blue-600",
      bgColor: "bg-blue-100 dark:bg-blue-900/30"
    },
    {
      icon: HardDrive,
      label: "Storage",
      value: formatBytes(systemInfo.totalStorage),
      color: "text-green-600",
      bgColor: "bg-green-100 dark:bg-green-900/30"
    },
    {
      icon: Server,
      label: "Searches (24h)",
      value: systemInfo.searchQueries.toString(),
      color: "text-purple-600",
      bgColor: "bg-purple-100 dark:bg-purple-900/30"
    },
    {
      icon: Zap,
      label: "Avg Search",
      value: `${systemInfo.averageSearchTime.toFixed(0)}ms`,
      color: "text-orange-600",
      bgColor: "bg-orange-100 dark:bg-orange-900/30"
    }
  ];

  return (
    <Card className="p-6 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-0 shadow-xl hover:shadow-2xl transition-all duration-500 animate-fade-in">
      <div className="flex flex-wrap items-center justify-between gap-6">
        {/* Main Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 flex-1">
          {stats.map((stat, index) => (
            <div 
              key={stat.label}
              className="flex items-center gap-3 animate-slide-in-right"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className={`p-3 rounded-xl ${stat.bgColor} transform transition-all duration-300 hover:scale-110`}>
                <stat.icon className={`h-5 w-5 ${stat.color}`} />
              </div>
              <div>
                <div className="font-bold text-lg text-foreground">{stat.value}</div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </div>
            </div>
          ))}
        </div>
        
        {/* Status Badge */}
        <div className="flex items-center gap-4 animate-slide-in-left">
          <Badge className={`${systemInfo.isRealtime ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' : 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400'} px-3 py-1 hover:scale-105 transition-transform duration-200`}>
            <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
            {systemInfo.isRealtime ? 'Realtime' : 'Polling'}
          </Badge>
          
          <div className="text-xs text-muted-foreground">
            Last sync: {systemInfo.lastSync.toLocaleTimeString()}
          </div>
        </div>
      </div>
      
      {/* Performance Indicators */}
      <div className="mt-6 pt-6 border-t border-border">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="col-span-1 md:col-span-2">
            <div className="grid grid-cols-2 gap-6">
              <div className="flex items-center gap-3">
                <Activity className="h-4 w-4 text-blue-600" />
                <div className="flex-1">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-muted-foreground">CPU Usage</span>
                    <span className="font-medium text-foreground">{systemInfo.cpuUsage}%</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div 
                      className="bg-gradient-to-r from-blue-500 to-blue-600 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${systemInfo.cpuUsage}%` }}
                    ></div>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <Cpu className="h-4 w-4 text-purple-600" />
                <div className="flex-1">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-muted-foreground">Memory Usage</span>
                    <span className="font-medium text-foreground">{systemInfo.memoryUsage}%</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div 
                      className="bg-gradient-to-r from-purple-500 to-purple-600 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${systemInfo.memoryUsage}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex flex-col justify-center">
            <div className="flex items-center mb-2">
              <div className="w-3 h-3 bg-blue-600 rounded-full mr-2"></div>
              <div className="text-sm">System Uptime: <span className="font-medium">{systemInfo.uptime}</span></div>
            </div>
            <div className="text-xs text-muted-foreground">
              Analytics refreshed in real-time
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};
