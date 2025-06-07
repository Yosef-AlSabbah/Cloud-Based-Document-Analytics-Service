
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Upload, Search, BarChart3, FileText, Zap, TrendingUp } from "lucide-react";

interface QuickActionsProps {
  setActiveTab: (tab: string) => void;
}

const QuickActions = ({ setActiveTab }: QuickActionsProps) => {
  const quickActions = [
    {
      icon: Upload,
      title: "Upload Documents",
      description: "Add new documents for processing",
      action: () => setActiveTab("upload"),
      color: "bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30",
      iconColor: "text-blue-600 dark:text-blue-400"
    },
    {
      icon: Search,
      title: "Search & Browse",
      description: "Find documents in your collection",
      action: () => setActiveTab("search"),
      color: "bg-green-50 dark:bg-green-900/20 hover:bg-green-100 dark:hover:bg-green-900/30",
      iconColor: "text-green-600 dark:text-green-400"
    },
    {
      icon: BarChart3,
      title: "View Analytics",
      description: "Analyze your document insights",
      action: () => setActiveTab("analytics"),
      color: "bg-purple-50 dark:bg-purple-900/20 hover:bg-purple-100 dark:hover:bg-purple-900/30",
      iconColor: "text-purple-600 dark:text-purple-400"
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {quickActions.map((action, index) => {
        const IconComponent = action.icon;
        return (
          <Card
            key={index}
            className={`${action.color} border-0 shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer transform hover:scale-105`}
            onClick={action.action}
          >
            <CardHeader className="text-center pb-3">
              <div className="mx-auto mb-3 p-3 rounded-full bg-white dark:bg-gray-800 shadow-md">
                <IconComponent className={`h-8 w-8 ${action.iconColor}`} />
              </div>
              <CardTitle className="text-lg font-bold text-foreground">
                {action.title}
              </CardTitle>
              <CardDescription className="text-muted-foreground">
                {action.description}
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <Button 
                className="w-full bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-600"
                variant="outline"
              >
                Get Started
              </Button>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default QuickActions;
