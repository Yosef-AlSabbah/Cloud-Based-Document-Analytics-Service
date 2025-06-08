
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Brain, Cpu, Zap, Settings, CheckCircle, AlertTriangle, Info } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AdvancedClassificationService, ClassificationConfig } from "@/services/AdvancedClassificationService";
import { Document } from "@/utils/types";

interface AIClassificationPanelProps {
  documents: Document[];
  onClassificationComplete: (documents: Document[]) => void;
}

export const AIClassificationPanel = ({ documents, onClassificationComplete }: AIClassificationPanelProps) => {
  const [isClassifying, setIsClassifying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [config, setConfig] = useState<ClassificationConfig>({
    method: 'hybrid',
    threshold: 0.7,
    useEmbeddings: false
  });
  const [classificationResults, setClassificationResults] = useState<Document[]>([]);
  const [showAdvancedSettings, setShowAdvancedSettings] = useState(false);
  const { toast } = useToast();

  const classificationMethods = {
    'hybrid': {
      name: 'Hybrid AI (Recommended)',
      description: 'Combines keyword analysis, structural features, and semantic similarity',
      icon: Brain,
      accuracy: '85-95%',
      speed: 'Fast',
      cost: 'Free'
    },
    'openai': {
      name: 'OpenAI GPT-4',
      description: 'Advanced language model with superior understanding',
      icon: Zap,
      accuracy: '90-98%',
      speed: 'Medium',
      cost: 'API Key Required'
    },
    'huggingface': {
      name: 'Hugging Face Transformers',
      description: 'Open-source transformer models for classification',
      icon: Cpu,
      accuracy: '80-92%',
      speed: 'Medium',
      cost: 'API Key Required'
    },
    'transformer': {
      name: 'Browser Transformers',
      description: 'Client-side transformer models (experimental)',
      icon: Brain,
      accuracy: '75-88%',
      speed: 'Slow',
      cost: 'Free'
    },
    'ensemble': {
      name: 'Ensemble Method',
      description: 'Combines multiple AI models for best accuracy',
      icon: Settings,
      accuracy: '90-96%',
      speed: 'Slow',
      cost: 'API Keys Required'
    }
  };

  const runClassification = async () => {
    if (documents.length === 0) {
      toast({
        title: "No Documents",
        description: "Please upload documents first",
        variant: "destructive",
      });
      return;
    }

    setIsClassifying(true);
    setProgress(0);

    try {
      console.log(`🚀 Starting AI classification with ${config.method} method`);
      
      const classifiedDocs: Document[] = [];
      
      for (let i = 0; i < documents.length; i++) {
        const doc = documents[i];
        setProgress((i / documents.length) * 100);
        
        try {
          console.log(`Classifying document ${i + 1}/${documents.length}: ${doc.title}`);
          
          const result = await AdvancedClassificationService.classifyDocument(
            doc.title || doc.filename,
            doc.content || '',
            config
          );
          
          const classifiedDoc: Document = {
            ...doc,
            classification: result.category,
            confidence: result.confidence * 100, // Convert to percentage
            document_classifications: [{
              category: result.category,
              subcategory: result.subcategory,
              confidence: result.confidence,
              algorithm: result.algorithm
            }]
          };
          
          classifiedDocs.push(classifiedDoc);
          
          console.log(`✅ Classified "${doc.title}" as ${result.category} > ${result.subcategory} (${(result.confidence * 100).toFixed(1)}%)`);
          
        } catch (error) {
          console.error(`❌ Failed to classify document ${doc.title}:`, error);
          
          // Add document with failed classification
          const failedDoc: Document = {
            ...doc,
            classification: 'Unclassified',
            confidence: 0,
            document_classifications: [{
              category: 'Unclassified',
              subcategory: 'Error',
              confidence: 0,
              algorithm: 'Classification Failed'
            }]
          };
          
          classifiedDocs.push(failedDoc);
        }
        
        // Small delay for better UX
        await new Promise(resolve => setTimeout(resolve, 200));
      }

      setClassificationResults(classifiedDocs);
      setProgress(100);
      onClassificationComplete(classifiedDocs);

      const successCount = classifiedDocs.filter(doc => doc.classification !== 'Unclassified').length;
      const failureCount = classifiedDocs.length - successCount;

      toast({
        title: "Classification Complete",
        description: `Successfully classified ${successCount} documents${failureCount > 0 ? `, ${failureCount} failed` : ''}`,
      });

    } catch (error) {
      console.error('❌ Classification batch failed:', error);
      toast({
        title: "Classification Failed",
        description: error instanceof Error ? error.message : "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setIsClassifying(false);
    }
  };

  const getMethodIcon = (method: string) => {
    const IconComponent = classificationMethods[method as keyof typeof classificationMethods]?.icon || Brain;
    return <IconComponent className="h-4 w-4" />;
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return "text-green-600";
    if (confidence >= 60) return "text-yellow-600";
    return "text-red-600";
  };

  const getConfidenceBadgeVariant = (confidence: number): "default" | "secondary" | "destructive" => {
    if (confidence >= 80) return "default";
    if (confidence >= 60) return "secondary";
    return "destructive";
  };

  return (
    <div className="space-y-6">
      {/* AI Classification Control */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            AI-Powered Document Classification
          </CardTitle>
          <CardDescription>
            Advanced machine learning models for intelligent document categorization
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Method Selection */}
          <div className="space-y-4">
            <Label htmlFor="method-select">Classification Method</Label>
            <Select value={config.method} onValueChange={(value) => setConfig({...config, method: value as ClassificationConfig['method']})}>
              <SelectTrigger id="method-select">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(classificationMethods).map(([key, method]) => (
                  <SelectItem key={key} value={key}>
                    <div className="flex items-center gap-2">
                      {getMethodIcon(key)}
                      <span>{method.name}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Method Info */}
            {config.method && (
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  <div className="space-y-2">
                    <p>{classificationMethods[config.method].description}</p>
                    <div className="flex gap-4 text-sm">
                      <span><strong>Accuracy:</strong> {classificationMethods[config.method].accuracy}</span>
                      <span><strong>Speed:</strong> {classificationMethods[config.method].speed}</span>
                      <span><strong>Cost:</strong> {classificationMethods[config.method].cost}</span>
                    </div>
                  </div>
                </AlertDescription>
              </Alert>
            )}
          </div>

          {/* Advanced Settings */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Switch
                id="advanced-settings"
                checked={showAdvancedSettings}
                onCheckedChange={setShowAdvancedSettings}
              />
              <Label htmlFor="advanced-settings">Advanced Settings</Label>
            </div>

            {showAdvancedSettings && (
              <div className="space-y-4 p-4 border rounded-lg bg-muted/30">
                <div className="space-y-2">
                  <Label htmlFor="confidence-threshold">Confidence Threshold: {config.threshold}</Label>
                  <input
                    id="confidence-threshold"
                    type="range"
                    min="0.1"
                    max="1.0"
                    step="0.1"
                    value={config.threshold}
                    onChange={(e) => setConfig({...config, threshold: parseFloat(e.target.value)})}
                    className="w-full"
                  />
                  <p className="text-sm text-muted-foreground">
                    Lower values accept more uncertain classifications
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <Switch
                    id="use-embeddings"
                    checked={config.useEmbeddings}
                    onCheckedChange={(checked) => setConfig({...config, useEmbeddings: checked})}
                  />
                  <Label htmlFor="use-embeddings">Use Semantic Embeddings (Experimental)</Label>
                </div>

                {config.method === 'openai' && (
                  <div className="space-y-2">
                    <Label htmlFor="openai-model">OpenAI Model</Label>
                    <Select value={config.model || 'gpt-4o-mini'} onValueChange={(value) => setConfig({...config, model: value})}>
                      <SelectTrigger id="openai-model">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="gpt-4o-mini">GPT-4o Mini (Fast, Cost-Effective)</SelectItem>
                        <SelectItem value="gpt-4o">GPT-4o (High Accuracy)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* API Key Warnings */}
          {(config.method === 'openai' || config.method === 'huggingface' || config.method === 'ensemble') && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                This method requires API keys to be configured in Supabase Edge Function Secrets.
                {config.method === 'openai' && ' You need an OpenAI API key.'}
                {config.method === 'huggingface' && ' You need a Hugging Face API key.'}
                {config.method === 'ensemble' && ' You need both OpenAI and Hugging Face API keys.'}
              </AlertDescription>
            </Alert>
          )}

          {/* Progress */}
          {isClassifying && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Classifying documents with AI...</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <Progress value={progress} className="w-full" />
            </div>
          )}

          {/* Action Button */}
          <div className="flex items-center gap-4">
            <Button 
              onClick={runClassification} 
              disabled={documents.length === 0 || isClassifying}
              className="flex items-center gap-2"
              size="lg"
            >
              {getMethodIcon(config.method)}
              {isClassifying ? "Classifying..." : `Classify ${documents.length} Documents`}
            </Button>
            
            {documents.length === 0 && (
              <p className="text-sm text-muted-foreground">Upload documents first to enable classification</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Classification Results */}
      {classificationResults.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>AI Classification Results</CardTitle>
            <CardDescription>
              Advanced classification results with confidence scores and algorithm details
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {classificationResults.map((doc) => (
                <div key={doc.id} className="p-4 border rounded-lg">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-medium text-foreground mb-1">{doc.title}</h4>
                      <p className="text-sm text-muted-foreground mb-2">{doc.filename}</p>
                      <div className="flex items-center gap-3 mb-2">
                        <Badge variant="default">
                          {doc.classification}
                        </Badge>
                        {doc.document_classifications?.[0]?.subcategory && (
                          <Badge variant="outline">
                            {doc.document_classifications[0].subcategory}
                          </Badge>
                        )}
                        <Badge variant={getConfidenceBadgeVariant(doc.confidence || 0)}>
                          {(doc.confidence || 0).toFixed(1)}% confidence
                        </Badge>
                      </div>
                      {doc.document_classifications?.[0]?.algorithm && (
                        <p className="text-xs text-muted-foreground">
                          Algorithm: {doc.document_classifications[0].algorithm}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {doc.classification !== 'Unclassified' ? (
                        <CheckCircle className="h-5 w-5 text-green-500" />
                      ) : (
                        <AlertTriangle className="h-5 w-5 text-red-500" />
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
