
export interface ProcessedDocument {
  title: string;
  content: string;
  metadata: {
    wordCount: number;
    language: string;
    pages: number;
  };
}

export interface ClassificationResult {
  category: string;
  subcategory: string;
  confidence: number;
  algorithm: string;
}
