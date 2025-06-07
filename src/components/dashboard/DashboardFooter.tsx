
import { Heart, Code } from "lucide-react";

const DashboardFooter = () => {
  return (
    <footer className="bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 mt-12">
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="text-center">
          <div className="flex items-center justify-center space-x-2 text-sm text-muted-foreground">
            <span>Built with</span>
            <Heart className="h-4 w-4 text-red-500" />
            <span>by</span>
            <Code className="h-4 w-4 text-blue-500" />
            <span className="font-semibold text-foreground">
              Yousef M. Y. Al Sabbah
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Cloud and Distributed Systems • Islamic University of Gaza • 2025
          </p>
        </div>
      </div>
    </footer>
  );
};

export default DashboardFooter;
