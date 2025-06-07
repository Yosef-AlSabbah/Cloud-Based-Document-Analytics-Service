
/**
 * Cloud Document Analytics Platform - Contact Page
 *
 * @author Yousef M. Y. Al Sabbah
 * @course Cloud and Distributed Systems
 * @university Islamic University of Gaza
 * @date June 7, 2025
 */

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { FileText, ArrowLeft, Mail, Phone, Instagram, Linkedin, Github, ExternalLink, MessageCircle, Send } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";

const Contact = () => {
  const navigate = useNavigate();

  const contactInfo = [
    {
      icon: MessageCircle,
      label: "WhatsApp",
      value: "+972-59-812-9670",
      href: "https://wa.me/972598129670/?text=Hello%20Yousef!%20I'm%20interested%20in%20your%20backend%20services.%20Can%20we%20talk%3F",
      color: "from-green-500 to-green-600",
      priority: true
    },
    {
      icon: Send,
      label: "Telegram",
      value: "@itzyousef_py",
      href: "https://t.me/itzyousef_py",
      color: "from-blue-500 to-blue-600"
    },
    {
      icon: Phone,
      label: "Phone",
      value: "+972 59-812-9670",
      href: "tel:+972598129670",
      color: "from-purple-500 to-purple-600"
    },
    {
      icon: Mail,
      label: "Email",
      value: "yalsabbah@students.iugaza.edu.ps",
      href: "mailto:yalsabbah@students.iugaza.edu.ps",
      color: "from-red-500 to-red-600"
    },
    {
      icon: Github,
      label: "GitHub",
      value: "Yosef-AlSabbah",
      href: "https://github.com/Yosef-AlSabbah",
      color: "from-gray-700 to-gray-900"
    },
    {
      icon: Linkedin,
      label: "LinkedIn",
      value: "Yosef AlSabbah",
      href: "https://www.linkedin.com/in/Yosef-AlSabbah",
      color: "from-blue-600 to-blue-700"
    },
    {
      icon: Instagram,
      label: "Instagram",
      value: "@itzyousef.py",
      href: "https://www.instagram.com/itzyousef.py",
      color: "from-pink-500 to-purple-600"
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
        <div className="text-center mb-16 animate-fade-in">
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 dark:text-white mb-6">
            Contact Me
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Get in touch with me for backend development services, collaboration, or just to connect
          </p>
        </div>

        {/* WhatsApp CTA - Featured */}
        <div className="mb-12 animate-fade-in">
          <Card className="p-8 bg-gradient-to-r from-green-500 to-green-600 text-white border-0 shadow-2xl hover:shadow-3xl transition-all duration-300 transform hover:scale-105 card-animate">
            <div className="text-center">
              <MessageCircle className="h-16 w-16 mx-auto mb-4 animate-bounce-subtle" />
              <h2 className="text-2xl font-bold mb-4">Ready to discuss your project?</h2>
              <p className="text-green-100 mb-6 text-lg">
                Let's connect on WhatsApp for quick communication about backend services and development projects.
              </p>
              <Button 
                onClick={() => window.open('https://wa.me/972598129670/?text=Hello%20Yousef!%20I\'m%20interested%20in%20your%20backend%20services.%20Can%20we%20talk%3F', '_blank')}
                className="bg-white text-green-600 hover:bg-green-50 px-8 py-4 text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 btn-ripple"
              >
                <MessageCircle className="h-5 w-5 mr-2" />
                Chat on WhatsApp
              </Button>
            </div>
          </Card>
        </div>

        {/* Contact Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {contactInfo.filter(contact => !contact.priority).map((contact, index) => (
            <Card 
              key={contact.label}
              className="p-6 hover:shadow-xl transition-all duration-300 transform hover:scale-105 border-0 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm animate-fade-in group cursor-pointer card-animate hover-glow"
              style={{ animationDelay: `${index * 0.1}s` }}
              onClick={() => window.open(contact.href, '_blank')}
            >
              <div className="text-center">
                <div className={`inline-flex p-4 rounded-xl bg-gradient-to-r ${contact.color} mb-4 group-hover:scale-110 transition-transform duration-300 shadow-lg`}>
                  <contact.icon className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  {contact.label}
                </h3>
                <p className="text-gray-600 dark:text-gray-300 mb-3 break-all">
                  {contact.value}
                </p>
                <div className="flex items-center justify-center text-blue-600 dark:text-blue-400 group-hover:text-blue-700 dark:group-hover:text-blue-300 transition-colors duration-300">
                  <ExternalLink className="h-4 w-4 mr-1" />
                  <span className="text-sm font-medium">Connect</span>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Additional Info */}
        <Card className="p-8 md:p-12 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm shadow-xl border-0 animate-scale-in card-animate">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
              Let's Connect!
            </h2>
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/30 dark:to-indigo-900/30 rounded-xl p-8 mb-8">
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed max-w-3xl mx-auto">
                I'm always excited to discuss technology, backend development, async programming, and innovative solutions. 
                Whether you have questions about this platform, want to collaborate on projects, need backend services, 
                or just want to connect with a fellow developer, feel free to reach out through any of the channels above.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div className="bg-blue-50 dark:bg-blue-900/30 rounded-xl p-6 hover-lift">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Backend Services</h3>
                <p className="text-gray-600 dark:text-gray-300 text-sm">
                  Need async programming, API development, database optimization, or testing services? Let's discuss your requirements.
                </p>
              </div>
              
              <div className="bg-indigo-50 dark:bg-indigo-900/30 rounded-xl p-6 hover-lift">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Collaboration</h3>
                <p className="text-gray-600 dark:text-gray-300 text-sm">
                  Interested in working together on similar projects or contributing to open-source initiatives.
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Button 
                onClick={() => window.open('mailto:yalsabbah@students.iugaza.edu.ps', '_blank')}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-8 py-3 font-semibold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 btn-ripple"
              >
                <Mail className="h-4 w-4 mr-2" />
                Send Email
              </Button>
              <Button 
                variant="outline" 
                onClick={() => navigate('/about')}
                className="px-8 py-3 font-semibold border-2 hover:bg-blue-50 dark:hover:bg-gray-800 transition-all duration-300"
              >
                Learn More About Me
              </Button>
            </div>
          </div>
        </Card>
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

export default Contact;
