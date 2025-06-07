
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

export interface Document {
  id: string;
  title: string;
  content: string;
  filename: string;
  size: number;
  type: string;
  uploadDate: Date;
  classification?: string;
  confidence?: number;
}
