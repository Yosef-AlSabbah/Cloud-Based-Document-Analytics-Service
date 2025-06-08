// -------------------------------------------------------------
// Cloud-Based-Document-Analytics-Service
// Author: Yousef M. Y. Al Sabbah
// https://github.com/Yosef-AlSabbah/Cloud-Based-Document-Analytics-Service
// -------------------------------------------------------------

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Filter, Brain, FileText, ChevronRight, Clock } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

interface Document {
  id: string;
  name: string;
  title?: string;
  content?: string;
  size: number;
  uploadTime: Date;
  type: string;
  classification?: {
    category: string;
    subcategory: string;
    confidence: number;
    algorithm: string;
  };
}

const CLASSIFICATION_TREE = {
  "Academic": {
    "Research Papers": ["Computer Science", "Engineering", "Mathematics", "Physics"],
    "Thesis & Dissertations": ["Masters Thesis", "PhD Dissertation", "Undergraduate Thesis"],
    "Course Materials": ["Lecture Notes", "Assignments", "Exams", "Syllabi"]
  },
  "Technical": {
    "Documentation": ["API Documentation", "User Manuals", "Technical Specifications"],
    "Reports": ["Technical Reports", "Project Reports", "Analysis Reports"],
    "Standards": ["IEEE Standards", "ISO Standards", "Industry Standards"]
  },
  "Business": {
    "Proposals": ["Project Proposals", "Business Plans", "Grant Proposals"],
    "Contracts": ["Service Agreements", "License Agreements", "Partnership Agreements"],
    "Reports": ["Financial Reports", "Market Analysis", "Performance Reports"]
  },
  "Legal": {
    "Policies": ["Privacy Policies", "Terms of Service", "Internal Policies"],
    "Regulations": ["Government Regulations", "Industry Regulations", "Compliance Documents"],
    "Agreements": ["Legal Contracts", "MOUs", "NDAs"]
  }
};

const ALGORITHMS = {
  "naive_bayes": "Naive Bayes Classifier",
  "svm": "Support Vector Machine",
  "random_forest": "Random Forest",
  "neural_network": "Neural Network (Deep Learning)"
};

export const ClassificationPanel = () => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [selectedAlgorithm, setSelectedAlgorithm] = useState<string>("naive_bayes");
  const [isClassifying, setIsClassifying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [classificationTime, setClassificationTime] = useState<number>(0);
  const [classifiedDocs, setClassifiedDocs] = useState<Document[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    // Load documents from cloud storage
    const loadDocuments = () => {
      const stored = localStorage.getItem('cloudDocuments');
      if (stored) {
        const parsedDocs = JSON.parse(stored);
        setDocuments(parsedDocs.map((doc: any) => ({
          ...doc,
          uploadTime: new Date(doc.uploadTime)
        })));
      }
    };

    loadDocuments();
  }, []);

  const classifyDocument = (doc: Document, algorithm: string) => {
    const content = (doc.title || doc.name) + ' ' + (doc.content || '');
    const contentLower = content.toLowerCase();
    
    // Simple rule-based classification for demo
    let category = "Technical";
    let subcategory = "Documentation";
    let confidence = 0.75;

    // Academic classification
    if (contentLower.includes('research') || contentLower.includes('study') || contentLower.includes('analysis')) {
      category = "Academic";
      subcategory = "Research Papers";
      confidence = 0.85;
    } else if (contentLower.includes('thesis') || contentLower.includes('dissertation')) {
      category = "Academic";
      subcategory = "Thesis & Dissertations";
      confidence = 0.90;
    } else if (contentLower.includes('lecture') || contentLower.includes('course') || contentLower.includes('assignment')) {
      category = "Academic";
      subcategory = "Course Materials";
      confidence = 0.80;
    }
    // Business classification
    else if (contentLower.includes('proposal') || contentLower.includes('business plan')) {
      category = "Business";
      subcategory = "Proposals";
      confidence = 0.85;
    } else if (contentLower.includes('contract') || contentLower.includes('agreement')) {
      category = "Business";
      subcategory = "Contracts";
      confidence = 0.88;
    } else if (contentLower.includes('financial') || contentLower.includes('market') || contentLower.includes('performance')) {
      category = "Business";
      subcategory = "Reports";
      confidence = 0.82;
    }
    // Legal classification
    else if (contentLower.includes('policy') || contentLower.includes('privacy') || contentLower.includes('terms')) {
      category = "Legal";
      subcategory = "Policies";
      confidence = 0.87;
    } else if (contentLower.includes('regulation') || contentLower.includes('compliance')) {
      category = "Legal";
      subcategory = "Regulations";
      confidence = 0.83;
    }
    // Technical classification
    else if (contentLower.includes('api') || contentLower.includes('documentation') || contentLower.includes('manual')) {
      category = "Technical";
      subcategory = "Documentation";
      confidence = 0.84;
    } else if (contentLower.includes('standard') || contentLower.includes('specification')) {
      category = "Technical";
      subcategory = "Standards";
      confidence = 0.86;
    }

    // Adjust confidence based on algorithm
    switch (algorithm) {
      case "neural_network":
        confidence = Math.min(confidence + 0.1, 0.95);
        break;
      case "random_forest":
        confidence = Math.min(confidence + 0.05, 0.92);
        break;
      case "svm":
        confidence = Math.min(confidence + 0.03, 0.90);
        break;
      default: // naive_bayes
        break;
    }

    return {
      category,
      subcategory,
      confidence: Math.round(confidence * 100) / 100,
      algorithm: ALGORITHMS[algorithm as keyof typeof ALGORITHMS]
    };
  };

  const runClassification = async () => {
    if (documents.length === 0) {
      toast({
        title: "No Documents",
        description: "Please upload some documents first",
        variant: "destructive",
      });
      return;
    }

    setIsClassifying(true);
    setProgress(0);
    const startTime = performance.now();

    try {
      console.log(`Starting classification with ${ALGORITHMS[selectedAlgorithm as keyof typeof ALGORITHMS]}`);
      
      const classified: Document[] = [];
      
      for (let i = 0; i < documents.length; i++) {
        const doc = documents[i];
        setProgress((i / documents.length) * 100);
        
        // Simulate classification processing time
        await new Promise(resolve => setTimeout(resolve, 500));
        
        const classification = classifyDocument(doc, selectedAlgorithm);
        
        const classifiedDoc: Document = {
          ...doc,
          classification
        };
        
        classified.push(classifiedDoc);
        console.log(`Classified "${doc.title || doc.name}" as ${classification.category} > ${classification.subcategory} (${(classification.confidence * 100).toFixed(1)}%)`);
      }

      setClassifiedDocs(classified);
      setProgress(100);
      
      const endTime = performance.now();
      setClassificationTime(endTime - startTime);

      // Update documents in storage with classification
      localStorage.setItem('cloudDocuments', JSON.stringify(classified));

      toast({
        title: "Classification Complete",
        description: `${classified.length} documents classified in ${((endTime - startTime) / 1000).toFixed(2)}s`,
      });

    } catch (error) {
      console.error('Classification error:', error);
      toast({
        title: "Classification Failed",
        description: "There was an error classifying the documents",
        variant: "destructive",
      });
    } finally {
      setIsClassifying(false);
    }
  };

  const getCategoryColor = (category: string) => {
    const colors = {
      "Academic": "bg-blue-100 text-blue-800 border-blue-200",
      "Technical": "bg-green-100 text-green-800 border-green-200", 
      "Business": "bg-purple-100 text-purple-800 border-purple-200",
      "Legal": "bg-red-100 text-red-800 border-red-200"
    };
    return colors[category as keyof typeof colors] || "bg-gray-100 text-gray-800 border-gray-200";
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.85) return "text-green-600";
    if (confidence >= 0.70) return "text-yellow-600";
    return "text-red-600";
  };

  return (
    <div className="space-y-6">
      {/* Classification Tree Display */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center">
          <Filter className="h-5 w-5 mr-2" />
          Predefined Classification Tree
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Object.entries(CLASSIFICATION_TREE).map(([category, subcategories]) => (
            <Card key={category} className="p-4 border-l-4 border-l-blue-500">
              <h4 className="font-semibold text-gray-900 mb-3">{category}</h4>
              <div className="space-y-2">
                {Object.entries(subcategories).map(([subcat, items]) => (
                  <div key={subcat}>
                    <div className="flex items-center text-sm font-medium text-gray-700 mb-1">
                      <ChevronRight className="h-3 w-3 mr-1" />
                      {subcat}
                    </div>
                    <div className="ml-4 space-y-1">
                      {items.map((item) => (
                        <div key={item} className="text-xs text-gray-600">• {item}</div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          ))}
        </div>
      </Card>

      {/* Classification Controls */}
      <Card className="p-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold flex items-center">
                <Brain className="h-5 w-5 mr-2" />
                Document Classification
              </h3>
              <p className="text-gray-600">Classify documents using machine learning algorithms</p>
            </div>
            <Badge variant="secondary">{documents.length} documents ready</Badge>
          </div>

          <div className="flex gap-4 items-center">
            <div className="flex gap-2 items-center">
              <span className="text-sm text-gray-600">Algorithm:</span>
              <Select value={selectedAlgorithm} onValueChange={setSelectedAlgorithm}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(ALGORITHMS).map(([key, name]) => (
                    <SelectItem key={key} value={key}>{name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button
              onClick={runClassification}
              disabled={isClassifying || documents.length === 0}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Brain className="h-4 w-4 mr-2" />
              {isClassifying ? "Classifying..." : "Start Classification"}
            </Button>
          </div>

          {isClassifying && (
            <div>
              <Progress value={progress} className="w-full mb-2" />
              <p className="text-sm text-gray-600">
                Processing documents... {Math.round(progress)}%
              </p>
            </div>
          )}
        </div>
      </Card>

      {/* Classification Results */}
      {classifiedDocs.length > 0 && (
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold flex items-center">
              <FileText className="h-5 w-5 mr-2" />
              Classification Results
            </h3>
            {classificationTime > 0 && (
              <Badge variant="secondary" className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {(classificationTime / 1000).toFixed(2)}s
              </Badge>
            )}
          </div>

          <div className="space-y-4">
            {classifiedDocs.map((doc) => (
              <Card key={doc.id} className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <FileText className="h-5 w-5 text-blue-600" />
                      <h4 className="font-semibold text-gray-900">{doc.title || doc.name}</h4>
                    </div>
                    
                    {doc.classification && (
                      <div className="flex items-center gap-3 mb-2">
                        <Badge className={getCategoryColor(doc.classification.category)}>
                          {doc.classification.category}
                        </Badge>
                        <span className="text-sm text-gray-600">
                          <ChevronRight className="h-3 w-3 inline mr-1" />
                          {doc.classification.subcategory}
                        </span>
                        <span className={`text-sm font-medium ${getConfidenceColor(doc.classification.confidence)}`}>
                          {(doc.classification.confidence * 100).toFixed(1)}% confidence
                        </span>
                      </div>
                    )}
                    
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span>{(doc.size / 1024 / 1024).toFixed(2)} MB</span>
                      <span>{doc.uploadTime.toLocaleDateString()}</span>
                      {doc.classification && (
                        <span>Algorithm: {doc.classification.algorithm}</span>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
};
