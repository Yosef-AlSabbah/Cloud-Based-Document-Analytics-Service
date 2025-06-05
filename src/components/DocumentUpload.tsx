/**
 * Cloud Document Analytics Platform
 *
 * @author Yousef M. Y. Al Sabbah
 * @course Cloud and Distributed Systems
 * @university Islamic University of Gaza
 * @date May 31, 2025
 *
 * Document Upload Component
 * Handles file uploads, processing, and storage in Supabase
 */

import { useState, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/components/ui/use-toast";
import { Upload, Globe, FileText, CheckCircle, MousePointer, X } from "lucide-react";
import { DocumentProcessor } from "@/utils/DocumentProcessor";
import { supabase } from "@/integrations/supabase/client";

/**
 * Interface representing an uploaded document file with metadata
 */
interface UploadedFile {
  id: string;
  name: string;
  size: number;
  type: string;
  title?: string;
  content?: string;
  upload_time: string;
}

/**
 * DocumentUpload Component
 * Provides drag-and-drop and file selection functionality for document uploads
 */
export const DocumentUpload = () => {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [scrapingUrl, setScrapingUrl] = useState("");
  const [isScrapingUrls, setIsScrapingUrls] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileUpload = async (selectedFiles: File[]) => {
    if (selectedFiles.length === 0) return;

    // Check authentication
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to upload documents",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);
    setProgress(0);

    try {
      const processedFiles: UploadedFile[] = [];
      
      for (let i = 0; i < selectedFiles.length; i++) {
        const file = selectedFiles[i];
        setProgress((i / selectedFiles.length) * 100);

        console.log(`Processing file: ${file.name}`);
        
        // Process document content
        const processed = await DocumentProcessor.processDocument(file);
        
        // Classify document
        const classification = await DocumentProcessor.classifyDocument(
          processed.content, 
          processed.title
        );
        
        // Upload to Supabase
        const documentId = await DocumentProcessor.uploadToSupabase(
          file, 
          processed, 
          classification
        );

        const uploadedFile: UploadedFile = {
          id: documentId,
          name: file.name,
          size: file.size,
          type: file.type,
          title: processed.title,
          content: processed.content,
          upload_time: new Date().toISOString()
        };

        processedFiles.push(uploadedFile);
      }

      setFiles(prev => [...prev, ...processedFiles]);
      setProgress(100);
      
      toast({
        title: "Upload Successful",
        description: `${selectedFiles.length} document(s) uploaded, processed, and classified successfully`,
      });

    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "Upload Failed",
        description: "There was an error uploading your documents",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleFileInputChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(event.target.files || []);
    await handleFileUpload(selectedFiles);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    const droppedFiles = Array.from(e.dataTransfer.files);
    
    // Filter for supported file types
    const supportedFiles = droppedFiles.filter(file => 
      file.type === 'application/pdf' || 
      file.type === 'application/msword' || 
      file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    );

    if (supportedFiles.length === 0) {
      toast({
        title: "Unsupported File Type",
        description: "Please upload PDF, DOC, or DOCX files only",
        variant: "destructive",
      });
      return;
    }

    if (supportedFiles.length !== droppedFiles.length) {
      toast({
        title: "Some Files Skipped",
        description: `${droppedFiles.length - supportedFiles.length} unsupported files were skipped. Only PDF, DOC, and DOCX files are allowed.`,
        variant: "destructive",
      });
    }

    await handleFileUpload(supportedFiles);
  };

  const handleWebScraping = async () => {
    if (!scrapingUrl.trim()) {
      toast({
        title: "Invalid URL",
        description: "Please enter a valid URL to scrape",
        variant: "destructive",
      });
      return;
    }

    // Check authentication
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to use web scraping",
        variant: "destructive",
      });
      return;
    }

    setIsScrapingUrls(true);
    
    try {
      console.log(`Starting web scraping for: ${scrapingUrl}`);
      
      // Call web scraping edge function
      const { data, error } = await supabase.functions.invoke('web-scraper', {
        body: { url: scrapingUrl }
      });

      if (error) throw error;

      const scrapedDocs = data.documents || [];
      setFiles(prev => [...prev, ...scrapedDocs]);
      setScrapingUrl("");
      
      toast({
        title: "Web Scraping Complete",
        description: `Successfully scraped ${scrapedDocs.length} documents from the provided URL`,
      });

    } catch (error) {
      console.error('Scraping error:', error);
      toast({
        title: "Scraping Failed",
        description: "There was an error scraping documents from the URL",
        variant: "destructive",
      });
    } finally {
      setIsScrapingUrls(false);
    }
  };

  const removeFile = (fileId: string) => {
    setFiles(prev => prev.filter(file => file.id !== fileId));
  };

  return (
    <div className="space-y-6">
      {/* File Upload Section with Enhanced Drag & Drop */}
      <Card 
        className={`p-6 md:p-8 border-2 border-dashed transition-all duration-300 card-animate hover-lift ${
          isDragOver 
            ? 'border-blue-500 bg-gradient-to-br from-blue-50 to-blue-100 scale-[1.02] shadow-lg' 
            : 'border-blue-300 bg-gradient-to-br from-blue-50/50 to-indigo-50/30 hover:border-blue-400'
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <div className="text-center">
          <div className={`transition-all duration-300 ${isDragOver ? 'animate-bounce-subtle' : ''}`}>
            <Upload className={`h-16 w-16 mx-auto mb-4 transition-all duration-300 ${
              isDragOver ? 'text-blue-700 scale-110' : 'text-blue-600'
            }`} />
          </div>
          
          <h3 className="text-xl font-bold text-gray-900 mb-2 responsive-heading">
            Upload Documents
          </h3>
          
          <p className="text-gray-600 mb-6 responsive-text max-w-md mx-auto">
            {isDragOver 
              ? "🎯 Drop your files here to upload them instantly!" 
              : "Drag & drop files here or click to browse your computer"
            }
          </p>
          
          <div className="flex items-center justify-center gap-2 text-sm text-gray-500 mb-6 flex-wrap">
            <MousePointer className="h-4 w-4" />
            <span className="text-center">Supports PDF, DOC, and DOCX files up to 50MB</span>
          </div>
          
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept=".pdf,.doc,.docx"
            onChange={handleFileInputChange}
            className="hidden"
            id="file-upload"
          />
          
          <Button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-8 py-3 text-lg font-medium transition-all duration-300 transform hover:scale-105 hover-glow btn-ripple shadow-lg"
          >
            <Upload className="h-5 w-5 mr-2" />
            {uploading ? (
              <>
                <span className="loading-dots">Processing</span>
              </>
            ) : "Choose Files"}
          </Button>
          
          {uploading && (
            <div className="mt-6 space-y-3 animate-fade-in">
              <Progress value={progress} className="w-full h-3 progress-animate" />
              <div className="text-center space-y-1">
                <p className="text-sm font-medium text-gray-700">
                  Uploading, processing, and classifying documents...
                </p>
                <p className="text-xs text-gray-500">
                  {Math.round(progress)}% complete
                </p>
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Web Scraping Section with Enhanced UI */}
      <Card className="p-6 md:p-8 border-2 border-dashed border-green-300 bg-gradient-to-br from-green-50/50 to-emerald-50/30 card-animate hover-lift hover:border-green-400">
        <div className="text-center">
          <div className={`transition-all duration-300 ${isScrapingUrls ? 'animate-pulse-gentle' : ''}`}>
            <Globe className="h-16 w-16 text-green-600 mx-auto mb-4" />
          </div>
          
          <h3 className="text-xl font-bold text-gray-900 mb-2 responsive-heading">
            Web Scraping
          </h3>
          
          <p className="text-gray-600 mb-6 responsive-text max-w-md mx-auto">
            Automatically collect and process documents from web sources
          </p>
          
          <div className="flex flex-col sm:flex-row gap-3 max-w-lg mx-auto">
            <Input
              type="url"
              placeholder="Enter website URL to scrape..."
              value={scrapingUrl}
              onChange={(e) => setScrapingUrl(e.target.value)}
              disabled={isScrapingUrls}
              className="flex-1 h-12 text-center sm:text-left focus-ring"
            />
            <Button
              onClick={handleWebScraping}
              disabled={isScrapingUrls || !scrapingUrl.trim()}
              className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white px-6 py-3 font-medium transition-all duration-300 transform hover:scale-105 hover-glow btn-ripple shadow-lg h-12"
            >
              <Globe className="h-4 w-4 mr-2" />
              {isScrapingUrls ? (
                <span className="loading-dots">Scraping</span>
              ) : "Start Scraping"}
            </Button>
          </div>
        </div>
      </Card>

      {/* Recently Uploaded Files with Enhanced Display */}
      {files.length > 0 && (
        <Card className="p-6 md:p-8 card-animate hover-lift animate-fade-in">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-gray-900 flex items-center responsive-heading">
              <CheckCircle className="h-6 w-6 text-green-600 mr-2" />
              Recently Uploaded ({files.length})
            </h3>
          </div>
          
          <div className="grid gap-4 sm:gap-6">
            {files.slice(-5).map((file, index) => (
              <div 
                key={file.id} 
                className="group p-4 sm:p-6 bg-gradient-to-r from-gray-50 to-blue-50/30 rounded-xl border border-gray-200 hover:border-blue-300 transition-all duration-300 hover:shadow-md animate-fade-in"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-start gap-4 flex-1 min-w-0">
                    <div className="p-3 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg shadow-md group-hover:scale-110 transition-transform duration-300">
                      <FileText className="h-6 w-6 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900 text-lg mb-1 truncate">
                        {file.title || file.name}
                      </p>
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2 text-sm text-gray-600">
                        <span className="flex items-center">
                          📄 {(file.size / 1024 / 1024).toFixed(2)} MB
                        </span>
                        <span className="hidden sm:inline">•</span>
                        <span className="flex items-center">
                          🕒 {new Date(file.upload_time).toLocaleDateString()}
                        </span>
                        <span className="hidden sm:inline">•</span>
                        <span className="flex items-center">
                          ⏰ {new Date(file.upload_time).toLocaleTimeString()}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 text-green-600 bg-green-50 px-3 py-1 rounded-full">
                      <CheckCircle className="h-4 w-4" />
                      <span className="text-sm font-medium">Processed</span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFile(file.id)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 hover:bg-red-50 hover:text-red-600"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          {files.length > 5 && (
            <div className="mt-4 text-center">
              <p className="text-sm text-gray-500">
                Showing 5 most recent uploads • {files.length - 5} more in Documents tab
              </p>
            </div>
          )}
        </Card>
      )}
    </div>
  );
};
