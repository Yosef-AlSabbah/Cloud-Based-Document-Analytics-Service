
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
  keywords?: string[];
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
  
  // New fields to properly support document classification
  document_classifications?: {
    category: string;
    subcategory: string;
    confidence: number;
    algorithm: string;
  }[];
  
  // Additional metadata
  created_at?: string;
  updated_at?: string;
  user_id?: string;
}

// Helper type for file formats
export interface FileFormat {
  mimeType: string;
  extension: string;
  displayName: string;
}

// Map of supported file formats
export const FILE_FORMATS: Record<string, FileFormat> = {
  'pdf': {
    mimeType: 'application/pdf',
    extension: 'pdf',
    displayName: 'PDF'
  },
  'docx': {
    mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    extension: 'docx',
    displayName: 'Word Document'
  },
  'doc': {
    mimeType: 'application/msword',
    extension: 'doc',
    displayName: 'Word (Legacy)'
  },
  'txt': {
    mimeType: 'text/plain',
    extension: 'txt',
    displayName: 'Text File'
  },
  'xlsx': {
    mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    extension: 'xlsx',
    displayName: 'Excel Spreadsheet'
  },
  'xls': {
    mimeType: 'application/vnd.ms-excel',
    extension: 'xls',
    displayName: 'Excel (Legacy)'
  },
  'pptx': {
    mimeType: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    extension: 'pptx',
    displayName: 'PowerPoint'
  },
  'ppt': {
    mimeType: 'application/vnd.ms-powerpoint',
    extension: 'ppt',
    displayName: 'PowerPoint (Legacy)'
  },
  'jpeg': {
    mimeType: 'image/jpeg',
    extension: 'jpeg',
    displayName: 'JPEG Image'
  },
  'png': {
    mimeType: 'image/png',
    extension: 'png',
    displayName: 'PNG Image'
  }
};

// Function to convert MIME type to display format
export const getMimeTypeDisplay = (mimeType: string): string => {
  for (const format of Object.values(FILE_FORMATS)) {
    if (format.mimeType === mimeType) {
      return format.displayName;
    }
  }
  
  // If not found, try to extract from MIME type
  const parts = mimeType.split('/');
  if (parts.length === 2) {
    return parts[1].toUpperCase();
  }
  
  return mimeType;
};
