
import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Cloud, HardDrive, Zap, Activity } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface StatsData {
  totalDocuments: number;
  totalStorage: number;
  searchQueries: number;
  averageSearchTime: number;
}

export const PersistentStats = () => {
  const [stats, setStats] = useState<StatsData>({
    totalDocuments: 0,
    totalStorage: 0,
    searchQueries: 0,
    averageSearchTime: 0
  });

  useEffect(() => {
    const updateStats = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Get document count and total size
        const { data: documents } = await supabase
          .from('documents')
          .select('size')
          .eq('user_id', user.id);

        const totalStorage = documents?.reduce((sum, doc) => sum + (doc.size || 0), 0) || 0;

        // Get search statistics for last 24 hours
        const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
        const { data: searches } = await supabase
          .from('search_logs')
          .select('search_time_ms')
          .eq('user_id', user.id)
          .gte('created_at', twentyFourHoursAgo);

        const averageSearchTime = searches && searches.length > 0 
          ? searches.reduce((sum, search) => sum + search.search_time_ms, 0) / searches.length 
          : 0;

        setStats({
          totalDocuments: documents?.length || 0,
          totalStorage,
          searchQueries: searches?.length || 0,
          averageSearchTime
        });
      } catch (error) {
        console.error('Error updating stats:', error);
      }
    };

    updateStats();
    const interval = setInterval(updateStats, 30000); // Update every 30 seconds
    
    return () => clearInterval(interval);
  }, []);

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const statsItems = [
    {
      icon: Cloud,
      value: stats.totalDocuments.toString(),
      label: "Docs",
      color: "text-blue-600 dark:text-blue-400"
    },
    {
      icon: HardDrive,
      value: formatBytes(stats.totalStorage),
      label: "Storage",
      color: "text-green-600 dark:text-green-400"
    },
    {
      icon: Zap,
      value: stats.searchQueries.toString(),
      label: "Searches",
      color: "text-purple-600 dark:text-purple-400"
    },
    {
      icon: Activity,
      value: `${stats.averageSearchTime.toFixed(0)}ms`,
      label: "Avg Time",
      color: "text-orange-600 dark:text-orange-400"
    }
  ];

  return (
    <div className="glass-card p-4 mb-6 animate-slide-down">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-6">
          {statsItems.map((stat, index) => (
            <div 
              key={stat.label}
              className="flex items-center gap-2 animate-fade-in"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className={`p-2 rounded-lg ${stat.color} bg-opacity-10 backdrop-blur-sm icon-hover`}>
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </div>
              <div>
                <div className="text-sm font-semibold text-foreground">{stat.value}</div>
                <div className="text-xs text-muted-foreground">{stat.label}</div>
              </div>
            </div>
          ))}
        </div>
        
        <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 animate-pulse">
          <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
          Live
        </Badge>
      </div>
    </div>
  );
};
