
import { Home, Upload, Search, BarChart3, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";

interface TabItem {
  id: string;
  label: string;
  icon: string;
}

interface TabNavigationProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  tabItems: TabItem[];
}

const TabNavigation = ({ activeTab, setActiveTab, tabItems }: TabNavigationProps) => {
  const getIcon = (iconName: string) => {
    const icons = {
      Home,
      Upload,
      Search,
      BarChart3,
      Settings,
    };
    const IconComponent = icons[iconName as keyof typeof icons];
    return IconComponent ? <IconComponent className="h-4 w-4" /> : null;
  };

  return (
    <nav className="sticky top-[73px] z-40 backdrop-blur-md bg-white/90 dark:bg-gray-900/90 border-b border-gray-200 dark:border-gray-700">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex space-x-1 overflow-x-auto scrollbar-hide py-2">
          {tabItems.map((tab) => (
            <Button
              key={tab.id}
              variant={activeTab === tab.id ? "default" : "ghost"}
              className={`flex items-center space-x-2 whitespace-nowrap transition-all duration-300 ${
                activeTab === tab.id
                  ? 'bg-blue-600 text-white shadow-lg transform scale-105'
                  : 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100'
              }`}
              onClick={() => setActiveTab(tab.id)}
            >
              {getIcon(tab.icon)}
              <span className="font-medium">{tab.label}</span>
            </Button>
          ))}
        </div>
      </div>
    </nav>
  );
};

export default TabNavigation;
