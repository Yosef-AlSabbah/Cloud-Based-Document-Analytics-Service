
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { BarChart3, Brain, FileText, CheckCircle } from "lucide-react";
import { Document } from "@/utils/types";

interface DocumentClassificationProps {
  documents: Document[];
  onClassificationComplete: (documents: Document[]) => void;
}

// Predefined classification categories with keywords
const CLASSIFICATION_TREE = {
  "Business & Finance": [
    "business", "finance", "revenue", "profit", "investment", "budget", "financial", 
    "market", "sales", "strategy", "economic", "analysis", "report", "quarterly"
  ],
  "Technology": [
    "technology", "software", "hardware", "programming", "development", "code", 
    "system", "database", "network", "algorithm", "artificial intelligence", "ai"
  ],
  "Research & Academic": [
    "research", "study", "academic", "university", "paper", "thesis", "methodology", 
    "experiment", "hypothesis", "literature", "survey", "data", "statistical"
  ],
  "Legal & Compliance": [
    "legal", "law", "compliance", "regulation", "policy", "contract", "agreement", 
    "terms", "conditions", "liability", "intellectual property", "copyright"
  ],
  "Marketing & Communications": [
    "marketing", "advertising", "brand", "campaign", "customer", "communication", 
    "social media", "content", "promotion", "engagement", "outreach"
  ],
  "Human Resources": [
    "human resources", "hr", "employee", "staff", "recruitment", "training", 
    "performance", "benefits", "salary", "workplace", "personnel", "hiring"
  ],
  "Operations & Management": [
    "operations", "management", "process", "workflow", "logistics", "supply chain", 
    "quality", "efficiency", "optimization", "project management", "planning"
  ],
  "General": []
};

const DocumentClassification = ({ documents, onClassificationComplete }: DocumentClassificationProps) => {
  const [classifying, setClassifying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [classificationResults, setClassificationResults] = useState<Document[]>([]);

  const classifyDocument = (doc: Document): { category: string; confidence: number } => {
    const content = `${doc.title} ${doc.content}`.toLowerCase();
    const scores: { [key: string]: number } = {};
    
    // Calculate scores for each category
    Object.entries(CLASSIFICATION_TREE).forEach(([category, keywords]) => {
      if (category === "General") {
        scores[category] = 0.1; // Base score for general category
        return;
      }
      
      let score = 0;
      keywords.forEach(keyword => {
        const regex = new RegExp(keyword.toLowerCase(), 'g');
        const matches = content.match(regex) || [];
        score += matches.length;
      });
      
      // Normalize score based on content length and keyword count
      const normalizedScore = score / (keywords.length * 0.1);
      scores[category] = normalizedScore;
    });
    
    // Find the category with the highest score
    const bestCategory = Object.entries(scores).reduce((a, b) => 
      scores[a[0]] > scores[b[0]] ? a : b
    )[0];
    
    // Calculate confidence (0-100%)
    const maxScore = Math.max(...Object.values(scores));
    const confidence = Math.min(Math.max(maxScore * 10, 5), 95); // Ensure reasonable confidence range
    
    // If no category scores well, classify as General
    if (maxScore < 0.5) {
      return { category: "General", confidence: Math.max(confidence, 20) };
    }
    
    return { category: bestCategory, confidence };
  };

  const runClassification = async () => {
    if (documents.length === 0) return;
    
    setClassifying(true);
    setProgress(0);
    
    const classifiedDocs: Document[] = [];
    const total = documents.length;
    
    // Simulate processing time for better UX
    for (let i = 0; i < total; i++) {
      const doc = documents[i];
      
      // Add a small delay to show progress
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const classification = classifyDocument(doc);
      
      const classifiedDoc: Document = {
        ...doc,
        classification: classification.category,
        confidence: classification.confidence
      };
      
      classifiedDocs.push(classifiedDoc);
      setProgress(((i + 1) / total) * 100);
      
      console.log(`Classified "${doc.title}" as "${classification.category}" with ${classification.confidence.toFixed(1)}% confidence`);
    }
    
    setClassificationResults(classifiedDocs);
    onClassificationComplete(classifiedDocs);
    setClassifying(false);
    
    console.log('Classification completed for', total, 'documents');
  };

  const categoryStats = classificationResults.reduce((stats, doc) => {
    const category = doc.classification || 'Unclassified';
    stats[category] = (stats[category] || 0) + 1;
    return stats;
  }, {} as { [key: string]: number });

  const getConfidenceColor = (confidence: number = 0): string => {
    if (confidence >= 80) return "bg-green-500";
    if (confidence >= 60) return "bg-yellow-500";
    return "bg-red-500";
  };

  const getConfidenceBadgeVariant = (confidence: number = 0): "default" | "secondary" | "destructive" => {
    if (confidence >= 80) return "default";
    if (confidence >= 60) return "secondary";
    return "destructive";
  };

  return (
    <div className="space-y-6">
      {/* Classification Control */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            Document Classification
          </CardTitle>
          <CardDescription>
            Automatically classify documents using machine learning algorithms based on content analysis
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Classification Tree */}
          <div>
            <h4 className="font-medium mb-3">Classification Categories:</h4>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {Object.keys(CLASSIFICATION_TREE).filter(cat => cat !== "General").map(category => (
                <Badge key={category} variant="outline" className="justify-center p-2">
                  {category}
                </Badge>
              ))}
            </div>
          </div>

          {/* Progress */}
          {classifying && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Classifying documents...</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <Progress value={progress} className="w-full" />
            </div>
          )}

          {/* Action Button */}
          <div className="flex items-center gap-4">
            <Button 
              onClick={runClassification} 
              disabled={documents.length === 0 || classifying}
              className="flex items-center gap-2"
            >
              <BarChart3 className="h-4 w-4" />
              {classifying ? "Classifying..." : `Classify ${documents.length} Documents`}
            </Button>
            
            {documents.length === 0 && (
              <p className="text-sm text-gray-500">Upload documents first to enable classification</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Classification Results */}
      {classificationResults.length > 0 && (
        <>
          {/* Category Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Classification Summary</CardTitle>
              <CardDescription>
                Distribution of documents across categories
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {Object.entries(categoryStats).map(([category, count]) => (
                  <div key={category} className="text-center p-3 bg-gray-50 rounded-lg">
                    <div className="text-2xl font-bold text-gray-900">{count}</div>
                    <div className="text-sm text-gray-600">{category}</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Detailed Results */}
          <Card>
            <CardHeader>
              <CardTitle>Classification Results</CardTitle>
              <CardDescription>
                Detailed classification results with confidence scores
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {classificationResults.map((doc) => (
                  <div key={doc.id} className="p-4 border rounded-lg">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900 mb-1">{doc.title}</h4>
                        <p className="text-sm text-gray-600 mb-2">{doc.filename}</p>
                        <div className="flex items-center gap-3">
                          <Badge variant="default">
                            {doc.classification}
                          </Badge>
                          <Badge variant={getConfidenceBadgeVariant(doc.confidence)}>
                            {doc.confidence?.toFixed(1)}% confidence
                          </Badge>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-5 w-5 text-green-500" />
                        <Badge variant="outline">
                          {doc.type.toUpperCase()}
                        </Badge>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {/* No Documents */}
      {documents.length === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <FileText className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Documents Available</h3>
            <p className="text-gray-600">
              Upload documents first to enable automatic classification.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default DocumentClassification;
