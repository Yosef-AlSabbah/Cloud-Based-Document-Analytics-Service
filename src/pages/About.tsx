/**
 * Cloud Document Analytics Platform - About Page
 *
 * @author Yousef M. Y. Al Sabbah
 * @course Cloud and Distributed Systems
 * @university Islamic University of Gaza
 * @date June 7, 2025
 */

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { FileText, ArrowLeft, User, GraduationCap, Code, Heart, Github, Database, Bot, TestTube } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";

const About = () => {
  const navigate = useNavigate();

  // Scroll to top on component mount
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const currentWork = [
    {
      icon: Bot,
      title: "Telegram Bots",
      description: "Developing with Aiogram and aiohttp"
    },
    {
      icon: Code,
      title: "Async Backends",
      description: "Using asyncio and async/await paradigms"
    },
    {
      icon: Database,
      title: "Search Algorithms",
      description: "Trigram, stemming for intelligent retrieval"
    }
  ];

  const expertise = [
    {
      category: "Backend Development",
      skills: "Async programming, Redis, PostgreSQL"
    },
    {
      category: "Search Algorithms",
      skills: "Trigram, stemming, intelligent search"
    },
    {
      category: "DevOps",
      skills: "Docker, Kubernetes, RabbitMQ"
    },
    {
      category: "Testing",
      skills: "Security, reliability, stress testing"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 dark:from-gray-900 dark:via-blue-900 dark:to-indigo-900">
      {/* Header */}
      <header className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-md shadow-sm border-b border-white/20 dark:border-gray-700/20 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl shadow-lg">
                <FileText className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900 dark:text-white bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  Cloud Document Analytics
                </h1>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <ThemeToggle />
              <Button 
                variant="ghost" 
                onClick={() => navigate('/')}
                className="flex items-center space-x-2 hover:bg-blue-50 dark:hover:bg-gray-800"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Back to Home</span>
              </Button>
              <Button 
                onClick={() => navigate('/auth')}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl transition-all duration-300"
              >
                Get Started
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Hero Section */}
        <div className="text-center mb-16 animate-fade-in">
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 dark:text-white mb-6">
            About Me
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300">
            Backend Developer & AI Solutions Architect
          </p>
        </div>

        {/* Profile Section - Vertical Layout */}
        <Card className="p-8 md:p-12 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm shadow-xl border-0 animate-scale-in card-animate mb-12 hover-lift">
          {/* Profile Image & Basic Info - Centered */}
          <div className="text-center mb-8">
            <div className="w-32 h-32 mx-auto mb-6">
              <img 
                src="https://avatars.githubusercontent.com/u/115791483?v=4"
                alt="Yousef M. Y. Al-Sabbah"
                className="w-full h-full rounded-full object-cover shadow-2xl border-4 border-white dark:border-gray-700 animate-float"
              />
            </div>
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Yousef M. Y. Al-Sabbah
            </h2>
            <p className="text-lg text-blue-600 dark:text-blue-400 mb-6 font-semibold">
              Backend Developer & Software Engineer
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button 
                onClick={() => navigate('/contact')}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
              >
                Get in Touch
              </Button>
              <Button 
                variant="outline" 
                onClick={() => window.open('https://github.com/Yosef-AlSabbah', '_blank')}
                className="border-2 hover:bg-blue-50 dark:hover:bg-gray-800 transition-all duration-300 flex items-center space-x-2"
              >
                <Github className="h-4 w-4" />
                <span>View GitHub</span>
              </Button>
            </div>
          </div>

          {/* Bio Content - Vertical Sections */}
          <div className="space-y-8">
            <div className="text-center">
              <h3 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                Hello 🌎, I'm Yousef M. Y. Al-Sabbah
              </h3>
              <p className="text-lg text-gray-600 dark:text-gray-300 leading-relaxed max-w-3xl mx-auto">
                Backend Developer | Specialized in Async Programming, AI-Powered Solutions, and Advanced Search Algorithms
              </p>
            </div>
            
            <div>
              <h4 className="text-xl font-semibold text-gray-900 dark:text-white mb-3 text-center">
                Mission
              </h4>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed text-center max-w-2xl mx-auto">
                Passionate about building secure, scalable, and highly performant backend systems. 
                I focus on testing applications, ensuring reliability, and delivering cutting-edge 
                solutions for modern web services.
              </p>
            </div>
          </div>
        </Card>

        {/* Current Work Grid */}
        <div className="mb-12">
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-8 text-center">
            🔭 Current Work
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {currentWork.map((work, index) => (
              <Card 
                key={work.title}
                className="p-6 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm shadow-lg border-0 hover:shadow-xl transition-all duration-300 transform hover:scale-105 animate-fade-in card-animate hover-glow will-change-transform"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="text-center">
                  <div className="inline-flex p-4 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-500 mb-4 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                    <work.icon className="h-6 w-6 text-white" />
                  </div>
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-2">{work.title}</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-300">{work.description}</p>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* Expertise Section */}
        <div className="mb-12">
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-8 text-center">
            💬 Expertise & Skills
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {expertise.map((item, index) => (
              <Card 
                key={item.category}
                className="p-6 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm shadow-lg border-0 hover:shadow-xl transition-all duration-300 hover-lift animate-slide-in-right"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <h4 className="font-semibold text-gray-900 dark:text-white mb-2">{item.category}</h4>
                <p className="text-gray-600 dark:text-gray-300 text-sm">{item.skills}</p>
              </Card>
            ))}
          </div>
        </div>

        {/* Fun Fact & Learning - Vertical Stack */}
        <div className="space-y-6 mb-12">
          <Card className="p-8 bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/30 dark:to-blue-900/30 border-0 shadow-lg hover:shadow-xl transition-all duration-300 animate-scale-in">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center justify-center">
              <span className="mr-2">🌱</span> Currently Learning
            </h3>
            <ul className="space-y-2 text-gray-700 dark:text-gray-300 max-w-2xl mx-auto">
              <li className="flex items-center justify-center"><span className="w-2 h-2 bg-green-500 rounded-full mr-3"></span>Redis & RabbitMQ optimization</li>
              <li className="flex items-center justify-center"><span className="w-2 h-2 bg-green-500 rounded-full mr-3"></span>PostgreSQL complex operations</li>
              <li className="flex items-center justify-center"><span className="w-2 h-2 bg-green-500 rounded-full mr-3"></span>Advanced testing techniques</li>
            </ul>
          </Card>

          <Card className="p-8 bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/30 dark:to-orange-900/30 border-0 shadow-lg hover:shadow-xl transition-all duration-300 animate-scale-in">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center justify-center">
              <span className="mr-2">⚡</span> Fun Fact
            </h3>
            <p className="text-gray-700 dark:text-gray-300 text-center max-w-2xl mx-auto">
              Debugging and testing are my favorite parts of the development process! 
              I believe that thorough testing is the foundation of reliable software. 🚀
            </p>
          </Card>
        </div>

        {/* Academic Info - Vertical Cards */}
        <div className="space-y-6">
          <Card className="p-8 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm shadow-xl border-0 animate-scale-in">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
              <div className="flex flex-col items-center p-6 bg-blue-50 dark:bg-blue-900/30 rounded-xl hover-lift">
                <GraduationCap className="h-8 w-8 text-blue-600 dark:text-blue-400 mb-3" />
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Education</h3>
                <p className="text-gray-600 dark:text-gray-300 text-center text-sm">
                  Islamic University of Gaza<br />
                  Faculty of Information Technology
                </p>
              </div>
              
              <div className="flex flex-col items-center p-6 bg-indigo-50 dark:bg-indigo-900/30 rounded-xl hover-lift">
                <Code className="h-8 w-8 text-indigo-600 dark:text-indigo-400 mb-3" />
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Focus</h3>
                <p className="text-gray-600 dark:text-gray-300 text-center text-sm">
                  Software Development<br />
                  Backend & AI Solutions
                </p>
              </div>
              
              <div className="flex flex-col items-center p-6 bg-purple-50 dark:bg-purple-900/30 rounded-xl hover-lift">
                <Heart className="h-8 w-8 text-purple-600 dark:text-purple-400 mb-3" />
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Passion</h3>
                <p className="text-gray-600 dark:text-gray-300 text-center text-sm">
                  Building scalable solutions<br />
                  Testing & Reliability
                </p>
              </div>
            </div>
          </Card>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 dark:bg-gray-950 text-white py-12 px-4 sm:px-6 lg:px-8 mt-16">
        <div className="max-w-7xl mx-auto text-center">
          <div className="flex items-center justify-center space-x-3 mb-4">
            <div className="p-2 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl">
              <FileText className="h-6 w-6 text-white" />
            </div>
            <h3 className="text-xl font-bold">Cloud Document Analytics</h3>
          </div>
          <p className="text-gray-400 mb-6">
            Advanced document processing and analytics platform
          </p>
          <div className="border-t border-gray-800 pt-6">
            <p className="text-sm text-gray-400">
              © 2025 Cloud Document Analytics Platform. Islamic University of Gaza - Faculty of Information Technology
            </p>
            <p className="text-sm text-gray-300 mt-2">
              Made with ❤️ by <span className="font-semibold bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">Yousef M. Y. Al-Sabbah</span>
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default About;
