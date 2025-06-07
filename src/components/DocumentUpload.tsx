import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, FileText, Loader2, AlertCircle, HelpCircle, Globe, Link } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { DocumentProcessor } from "@/utils/DocumentProcessor";

interface DocumentUploadProps {
  onUploadComplete: () => void;
}

const DocumentUpload = ({ onUploadComplete }: DocumentUploadProps) => {
  const [isUploading, setIsUploading] = useState(false);
  const [isScraping, setIsScraping] = useState(false);
  const [scrapingUrl, setScrapingUrl] = useState("");
  const [showHelp, setShowHelp] = useState(false);
  const { toast } = useToast();

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;

    setIsUploading(true);

    try {
      for (const file of acceptedFiles) {
        console.log(`Processing file: ${file.name}`);
        
        // Process document using the static method
        const processedDoc = await DocumentProcessor.processDocument(file);
        const classification = await DocumentProcessor.classifyDocument(processedDoc.content, processedDoc.title);
        await DocumentProcessor.uploadToSupabase(file, processedDoc, classification);
      }

      toast({
        title: "Upload successful",
        description: `Successfully uploaded ${acceptedFiles.length} file(s)`,
      });

      onUploadComplete();
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : "Failed to upload files",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  }, [toast, onUploadComplete]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'application/msword': ['.doc'],
      'text/plain': ['.txt']
    },
    multiple: true
  });

  const handleWebScraping = async () => {
    if (!scrapingUrl.trim()) {
      toast({
        title: "URL required",
        description: "Please enter a URL to scrape",
        variant: "destructive",
      });
      return;
    }

    // Basic URL validation
    try {
      new URL(scrapingUrl);
    } catch {
      toast({
        title: "Invalid URL",
        description: "Please enter a valid URL (e.g., https://example.com)",
        variant: "destructive",
      });
      return;
    }

    setIsScraping(true);

    try {
      console.log('Starting web scraping for:', scrapingUrl);
      
      const { data, error } = await supabase.functions.invoke('web-scraper', {
        body: { url: scrapingUrl }
      });

      if (error) {
        console.error('Scraping error:', error);
        throw new Error(`Scraping failed: ${error.message}`);
      }

      if (data?.success) {
        toast({
          title: "Scraping successful",
          description: data.message || `Successfully scraped content from ${new URL(scrapingUrl).hostname}`,
        });
        
        setScrapingUrl("");
        onUploadComplete();
      } else {
        throw new Error(data?.error || 'Unknown scraping error occurred');
      }

    } catch (error) {
      console.error('Web scraping failed:', error);
      
      let errorMessage = "Web scraping failed";
      let errorDetails = "";

      if (error instanceof Error) {
        errorMessage = error.message;
        
        if (error.message.includes('Auth session missing')) {
          errorDetails = "Please make sure you're logged in and try again.";
        } else if (error.message.includes('timeout')) {
          errorDetails = "The website took too long to respond. Try a different URL.";
        } else if (error.message.includes('404')) {
          errorDetails = "The page was not found. Please check the URL.";
        } else if (error.message.includes('403')) {
          errorDetails = "Access denied. The website may block automated requests.";
        } else {
          errorDetails = "Please try a different URL or check your internet connection.";
        }
      }

      toast({
        title: errorMessage,
        description: errorDetails,
        variant: "destructive",
      });
    } finally {
      setIsScraping(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="glass-card border-border/50">
        <CardHeader>
          <CardTitle className="text-foreground">Upload Documents</CardTitle>
          <CardDescription className="text-muted-foreground">
            Add documents to your collection via file upload or web scraping
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="upload" className="w-full">
            <TabsList className="grid w-full grid-cols-2 bg-muted">
              <TabsTrigger value="upload" className="data-[state=active]:bg-background data-[state=active]:text-foreground">
                <Upload className="w-4 h-4 mr-2" />
                File Upload
              </TabsTrigger>
              <TabsTrigger value="scraping" className="data-[state=active]:bg-background data-[state=active]:text-foreground">
                <Globe className="w-4 h-4 mr-2" />
                Web Scraping
              </TabsTrigger>
            </TabsList>

            <TabsContent value="upload" className="space-y-4">
              <div
                {...getRootProps()}
                className={`border-2 border-dashed border-border rounded-lg p-8 text-center cursor-pointer transition-colors hover:bg-accent/50 ${
                  isDragActive ? 'border-primary bg-primary/10' : ''
                }`}
              >
                <input {...getInputProps()} />
                <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-lg font-medium text-foreground mb-2">
                  {isDragActive ? 'Drop files here' : 'Drag & drop files here'}
                </p>
                <p className="text-sm text-muted-foreground mb-4">
                  or click to browse files
                </p>
                <div className="flex flex-wrap justify-center gap-2">
                  <Badge variant="outline" className="border-border text-muted-foreground">PDF</Badge>
                  <Badge variant="outline" className="border-border text-muted-foreground">DOCX</Badge>
                  <Badge variant="outline" className="border-border text-muted-foreground">DOC</Badge>
                  <Badge variant="outline" className="border-border text-muted-foreground">TXT</Badge>
                </div>
              </div>

              {isUploading && (
                <div className="flex items-center justify-center p-4">
                  <Loader2 className="h-6 w-6 animate-spin mr-2 text-primary" />
                  <span className="text-foreground">Processing files...</span>
                </div>
              )}
            </TabsContent>

            <TabsContent value="scraping" className="space-y-4">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="scraping-url" className="text-foreground">Website URL</Label>
                  <div className="flex gap-2 mt-2">
                    <div className="relative flex-1">
                      <Link className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="scraping-url"
                        type="url"
                        placeholder="https://example.com/article"
                        value={scrapingUrl}
                        onChange={(e) => setScrapingUrl(e.target.value)}
                        className="pl-10 bg-background border-border text-foreground placeholder:text-muted-foreground"
                        disabled={isScraping}
                      />
                    </div>
                    <Button 
                      onClick={handleWebScraping} 
                      disabled={isScraping || !scrapingUrl.trim()}
                      className="bg-primary hover:bg-primary/90 text-primary-foreground"
                    >
                      {isScraping ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          Scraping...
                        </>
                      ) : (
                        <>
                          <Globe className="h-4 w-4 mr-2" />
                          Scrape
                        </>
                      )}
                    </Button>
                  </div>
                </div>

                <Collapsible open={showHelp} onOpenChange={setShowHelp}>
                  <CollapsibleTrigger asChild>
                    <Button variant="ghost" className="w-full justify-start text-muted-foreground hover:text-foreground hover:bg-accent">
                      <HelpCircle className="h-4 w-4 mr-2" />
                      How does web scraping work?
                    </Button>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="space-y-3 pt-3">
                    <Alert className="border-border bg-muted/30">
                      <AlertCircle className="h-4 w-4 text-muted-foreground" />
                      <AlertDescription className="text-foreground">
                        <strong>What it does:</strong> Automatically extracts text content from web pages and adds it to your document collection.
                      </AlertDescription>
                    </Alert>

                    <div className="space-y-3 text-sm">
                      <div>
                        <h4 className="font-medium text-foreground mb-2">✅ Supported Content:</h4>
                        <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-4">
                          <li>News articles and blog posts</li>
                          <li>Documentation pages</li>
                          <li>Text-heavy websites</li>
                          <li>Public web pages with readable content</li>
                        </ul>
                      </div>

                      <div>
                        <h4 className="font-medium text-foreground mb-2">❌ Not Supported:</h4>
                        <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-4">
                          <li>Password-protected or private pages</li>
                          <li>JavaScript-heavy applications (SPAs)</li>
                          <li>Direct file downloads (use file upload instead)</li>
                          <li>Pages that block automated access</li>
                        </ul>
                      </div>

                      <div>
                        <h4 className="font-medium text-foreground mb-2">💡 Example URLs:</h4>
                        <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-4">
                          <li>https://en.wikipedia.org/wiki/Artificial_intelligence</li>
                          <li>https://docs.example.com/getting-started</li>
                          <li>https://blog.example.com/latest-article</li>
                        </ul>
                      </div>
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default DocumentUpload;
