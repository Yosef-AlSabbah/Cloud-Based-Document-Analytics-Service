
/**
 * Cloud Document Analytics Platform - Landing Page
 *
 * @author Yousef M. Y. Al Sabbah
 * @course Cloud and Distributed Systems
 * @university Islamic University of Gaza
 * @date June 7, 2025
 */

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ThemeToggle } from "@/components/ThemeToggle";
import { TypingAnimation } from "@/components/TypingAnimation";
import { useNavigate } from "react-router-dom";
import { FileText, Search, BarChart3, Globe, Upload, Zap, Shield, Clock } from "lucide-react";

const Landing = () => {
  const navigate = useNavigate();

  // Scroll to top on component mount
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const typingWords = ["Document Workflow", "Work Process", "Digital Flow", "File Management", "Data Pipeline"];

  const features = [
    {
      icon: Upload,
      title: "Smart Document Upload",
      description: "Upload PDF, DOC, and DOCX files with automatic title extraction and content processing",
      color: "from-blue-500 to-blue-600"
    },
    {
      icon: Globe,
      title: "Web Scraping",
      description: "Automatically collect documents from websites with intelligent content detection",
      color: "from-green-500 to-green-600"
    },
    {
      icon: Search,
      title: "Advanced Search",
      description: "Search through document content with highlighted results and instant filtering",
      color: "from-purple-500 to-purple-600"
    },
    {
      icon: BarChart3,
      title: "Analytics Dashboard",
      description: "Comprehensive statistics and insights about your document collection",
      color: "from-orange-500 to-orange-600"
    },
    {
      icon: Zap,
      title: "AI Classification",
      description: "Automatic document categorization using advanced machine learning algorithms",
      color: "from-yellow-500 to-yellow-600"
    },
    {
      icon: Shield,
      title: "Secure & Private",
      description: "Your documents are encrypted and stored securely with user-level access control",
      color: "from-red-500 to-red-600"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 dark:from-gray-900 dark:via-blue-900 dark:to-indigo-900 transition-all duration-500 page-transition">
      {/* Header */}
      <header className="glass-header sticky top-0 z-50 transition-all duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-3 animate-slide-in-right">
              <div className="p-2 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl shadow-lg hover:scale-110 transition-transform duration-300 icon-hover">
                <FileText className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  Cloud Document Analytics
                </h1>
              </div>
            </div>
            
            <div className="flex items-center space-x-4 animate-slide-in-left">
              <ThemeToggle />
              <Button 
                variant="ghost" 
                onClick={() => navigate('/about')}
                className="btn-enhanced hover:bg-accent hover:text-accent-foreground transition-all duration-300 icon-hover"
              >
                About
              </Button>
              <Button 
                variant="ghost" 
                onClick={() => navigate('/contact')}
                className="btn-enhanced hover:bg-accent hover:text-accent-foreground transition-all duration-300 icon-hover"
              >
                Contact
              </Button>
              <Button 
                onClick={() => navigate('/auth')}
                className="btn-enhanced bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
              >
                Get Started
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-20 pb-32 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center animate-fade-in">
            <div className="mb-8">
              <div className="inline-flex items-center space-x-2 glass-card text-blue-800 dark:text-blue-200 px-4 py-2 text-sm font-medium animate-bounce-subtle">
                <Clock className="h-4 w-4 icon-hover" />
                <span>Advanced Document Processing Platform</span>
              </div>
            </div>
            
            <h1 className="text-4xl sm:text-6xl font-bold text-foreground mb-6 animate-slide-in-right font-display">
              Transform Your{" "}
              <span className="relative inline-block">
                <TypingAnimation 
                  words={typingWords}
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent"
                  speed={100}
                  deleteSpeed={50}
                  pauseTime={2000}
                />
              </span>
            </h1>
            
            <p className="text-xl text-muted-foreground mb-10 max-w-3xl mx-auto animate-slide-in-left leading-relaxed" style={{ animationDelay: '0.2s' }}>
              Upload, analyze, and search through your documents with AI-powered classification, 
              intelligent content extraction, and advanced analytics. Built for the modern digital workspace.
            </p>
            
            <div className="flex flex-col sm:flex-row justify-center gap-4 animate-scale-in" style={{ animationDelay: '0.4s' }}>
              <Button 
                onClick={() => navigate('/auth')}
                size="lg"
                className="btn-enhanced bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-8 py-4 text-lg font-semibold shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105 animate-glow"
              >
                Start Analyzing Documents
              </Button>
              <Button 
                variant="outline" 
                size="lg"
                onClick={() => navigate('/about')}
                className="btn-enhanced px-8 py-4 text-lg font-semibold border-2 hover:bg-accent transition-all duration-300 hover-lift"
              >
                Learn More
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 glass-card mx-4 transition-all duration-300">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16 animate-fade-in">
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4 font-display">
              Powerful Features for Document Management
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Everything you need to organize, analyze, and extract insights from your document collection
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card 
                key={feature.title}
                className="p-6 hover:shadow-xl transition-all duration-300 transform hover:scale-105 glass-card animate-fade-in card-animate hover-glow"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className={`inline-flex p-3 rounded-xl bg-gradient-to-r ${feature.color} mb-4 shadow-lg hover:shadow-xl transition-shadow duration-300 icon-hover`}>
                  <feature.icon className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-3 font-display">
                  {feature.title}
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  {feature.description}
                </p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <Card className="p-12 bg-gradient-to-r from-blue-600 to-indigo-600 text-white border-0 shadow-2xl animate-scale-in card-animate hover:shadow-3xl transition-shadow duration-500">
            <h2 className="text-3xl sm:text-4xl font-bold mb-6 font-display">
              Ready to Get Started?
            </h2>
            <p className="text-xl mb-8 opacity-90 leading-relaxed">
              Join thousands of professionals who trust our platform for their document management needs.
            </p>
            <Button 
              onClick={() => navigate('/auth')}
              size="lg"
              className="btn-enhanced bg-white text-blue-600 hover:bg-gray-100 px-8 py-4 text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
            >
              Start Your Free Account
            </Button>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="glass-header text-foreground py-12 px-4 sm:px-6 lg:px-8 transition-all duration-300">
        <div className="max-w-7xl mx-auto text-center">
          <div className="flex items-center justify-center space-x-3 mb-4">
            <div className="p-2 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl hover:scale-110 transition-transform duration-300 icon-hover">
              <FileText className="h-6 w-6 text-white" />
            </div>
            <h3 className="text-xl font-bold font-display">Cloud Document Analytics</h3>
          </div>
          <p className="text-muted-foreground mb-6">
            Advanced document processing and analytics platform
          </p>
          <div className="border-t border-border pt-6">
            <p className="text-sm text-muted-foreground">
              © 2025 Cloud Document Analytics Platform. Islamic University of Gaza - Faculty of Information Technology
            </p>
            <p className="text-sm text-foreground mt-2">
              Made with ❤️ by <span className="font-semibold bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">Yousef M. Y. Al-Sabbah</span>
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
