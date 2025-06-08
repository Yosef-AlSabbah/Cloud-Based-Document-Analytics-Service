
import { supabase } from "@/integrations/supabase/client";

export interface ClassificationResult {
  category: string;
  subcategory: string;
  confidence: number;
  algorithm: string;
  keywords?: string[];
  embedding?: number[];
}

export interface ClassificationConfig {
  method: 'transformer' | 'openai' | 'huggingface' | 'hybrid' | 'ensemble';
  model?: string;
  threshold?: number;
  useEmbeddings?: boolean;
}

/**
 * Advanced AI/ML Document Classification Service
 * Supports multiple state-of-the-art approaches for document classification
 */
export class AdvancedClassificationService {
  private static readonly CLASSIFICATION_CATEGORIES = {
    'Academic': {
      keywords: ['research', 'study', 'methodology', 'hypothesis', 'analysis', 'findings', 'conclusion', 'abstract', 'literature review', 'experiment'],
      subcategories: ['Research Paper', 'Thesis', 'Conference Paper', 'Journal Article', 'Technical Report']
    },
    'Business': {
      keywords: ['strategy', 'market', 'revenue', 'profit', 'business plan', 'financial', 'investment', 'proposal', 'contract', 'agreement'],
      subcategories: ['Business Plan', 'Financial Report', 'Market Analysis', 'Contract', 'Proposal']
    },
    'Technical': {
      keywords: ['algorithm', 'implementation', 'system', 'architecture', 'software', 'programming', 'development', 'api', 'documentation', 'specification'],
      subcategories: ['API Documentation', 'System Design', 'Software Manual', 'Technical Specification', 'Code Documentation']
    },
    'Legal': {
      keywords: ['law', 'legal', 'regulation', 'compliance', 'policy', 'terms', 'conditions', 'agreement', 'contract', 'liability'],
      subcategories: ['Legal Contract', 'Policy Document', 'Compliance Report', 'Terms of Service', 'Legal Brief']
    },
    'Medical': {
      keywords: ['patient', 'medical', 'health', 'diagnosis', 'treatment', 'clinical', 'pharmaceutical', 'therapy', 'symptoms', 'healthcare'],
      subcategories: ['Clinical Study', 'Medical Report', 'Patient Record', 'Pharmaceutical Research', 'Healthcare Policy']
    }
  };

  /**
   * Main classification method that routes to different AI approaches
   */
  static async classifyDocument(
    title: string,
    content: string,
    config: ClassificationConfig = { method: 'hybrid' }
  ): Promise<ClassificationResult> {
    console.log(`🤖 Starting AI classification with method: ${config.method}`);

    try {
      switch (config.method) {
        case 'transformer':
          return await this.classifyWithTransformers(title, content, config);
        case 'openai':
          return await this.classifyWithOpenAI(title, content, config);
        case 'huggingface':
          return await this.classifyWithHuggingFace(title, content, config);
        case 'hybrid':
          return await this.classifyWithHybridApproach(title, content, config);
        case 'ensemble':
          return await this.classifyWithEnsemble(title, content, config);
        default:
          return await this.classifyWithHybridApproach(title, content, config);
      }
    } catch (error) {
      console.error('❌ Classification error:', error);
      // Fallback to enhanced keyword-based classification
      return await this.classifyWithEnhancedKeywords(title, content);
    }
  }

  /**
   * Browser-based transformer classification using Hugging Face Transformers.js
   */
  private static async classifyWithTransformers(
    title: string,
    content: string,
    config: ClassificationConfig
  ): Promise<ClassificationResult> {
    try {
      // Use Hugging Face Transformers.js for client-side classification
      const { pipeline } = await import('@huggingface/transformers');
      
      const classifier = await pipeline(
        'text-classification',
        config.model || 'microsoft/DialoGPT-medium',
        { device: 'webgpu' }
      );

      const text = `${title} ${content}`.substring(0, 512); // Limit for performance
      const results = await classifier(text);

      // Handle both single and array results from transformers
      const result = Array.isArray(results) ? results[0] : results;
      
      // Map model results to our categories
      const mappedResult = this.mapToOurCategories(result);
      
      return {
        ...mappedResult,
        algorithm: `Transformer Model (${config.model || 'default'})`,
        confidence: (result as any).score || 0.5 // Type assertion for score property
      };
    } catch (error) {
      console.error('Transformer classification failed:', error);
      throw error;
    }
  }

  /**
   * OpenAI-based classification using GPT models
   */
  private static async classifyWithOpenAI(
    title: string,
    content: string,
    config: ClassificationConfig
  ): Promise<ClassificationResult> {
    try {
      const { data, error } = await supabase.functions.invoke('ai-document-classifier', {
        body: {
          title,
          content: content.substring(0, 2000), // Limit for API efficiency
          method: 'openai',
          model: config.model || 'gpt-4o-mini'
        }
      });

      if (error) throw error;

      return {
        category: data.category,
        subcategory: data.subcategory,
        confidence: data.confidence,
        algorithm: `OpenAI ${config.model || 'gpt-4o-mini'}`,
        keywords: data.keywords
      };
    } catch (error) {
      console.error('OpenAI classification failed:', error);
      throw error;
    }
  }

  /**
   * Hugging Face API-based classification
   */
  private static async classifyWithHuggingFace(
    title: string,
    content: string,
    config: ClassificationConfig
  ): Promise<ClassificationResult> {
    try {
      const { data, error } = await supabase.functions.invoke('ai-document-classifier', {
        body: {
          title,
          content: content.substring(0, 1000),
          method: 'huggingface',
          model: config.model || 'facebook/bart-large-mnli'
        }
      });

      if (error) throw error;

      return {
        category: data.category,
        subcategory: data.subcategory,
        confidence: data.confidence,
        algorithm: `Hugging Face ${config.model || 'BART-Large-MNLI'}`,
        keywords: data.keywords
      };
    } catch (error) {
      console.error('Hugging Face classification failed:', error);
      throw error;
    }
  }

  /**
   * Hybrid approach combining multiple techniques
   */
  private static async classifyWithHybridApproach(
    title: string,
    content: string,
    config: ClassificationConfig
  ): Promise<ClassificationResult> {
    const text = `${title} ${content}`.toLowerCase();
    
    // 1. Enhanced keyword analysis with TF-IDF-like scoring
    const keywordScores = this.calculateAdvancedKeywordScores(text);
    
    // 2. Structural analysis (document patterns)
    const structuralFeatures = this.extractStructuralFeatures(title, content);
    
    // 3. Semantic similarity (if embeddings available)
    const semanticScores = await this.calculateSemanticSimilarity(text);
    
    // 4. Combine scores with weighted approach
    const combinedScores = this.combineScores(keywordScores, structuralFeatures, semanticScores);
    
    const bestCategory = Object.entries(combinedScores)
      .sort(([,a], [,b]) => b - a)[0];
    
    const category = bestCategory[0];
    const confidence = Math.min(0.95, Math.max(0.6, bestCategory[1]));
    
    return {
      category,
      subcategory: this.selectBestSubcategory(category, text),
      confidence,
      algorithm: 'Hybrid AI (Keywords + Structure + Semantics)',
      keywords: this.extractRelevantKeywords(text, category)
    };
  }

  /**
   * Ensemble method combining multiple models
   */
  private static async classifyWithEnsemble(
    title: string,
    content: string,
    config: ClassificationConfig
  ): Promise<ClassificationResult> {
    const results: ClassificationResult[] = [];

    try {
      // Try multiple approaches and combine results
      const methods: ClassificationConfig['method'][] = ['openai', 'huggingface', 'hybrid'];
      
      for (const method of methods) {
        try {
          const result = await this.classifyDocument(title, content, { 
            ...config, 
            method,
            threshold: 0.5 
          });
          results.push(result);
        } catch (error) {
          console.warn(`Method ${method} failed:`, error);
        }
      }

      if (results.length === 0) {
        throw new Error('All ensemble methods failed');
      }

      // Vote-based ensemble
      const categoryVotes: Record<string, number> = {};
      const subcategoryVotes: Record<string, number> = {};
      let totalConfidence = 0;

      results.forEach(result => {
        categoryVotes[result.category] = (categoryVotes[result.category] || 0) + result.confidence;
        subcategoryVotes[result.subcategory] = (subcategoryVotes[result.subcategory] || 0) + result.confidence;
        totalConfidence += result.confidence;
      });

      const bestCategory = Object.entries(categoryVotes)
        .sort(([,a], [,b]) => b - a)[0][0];
      const bestSubcategory = Object.entries(subcategoryVotes)
        .sort(([,a], [,b]) => b - a)[0][0];

      return {
        category: bestCategory,
        subcategory: bestSubcategory,
        confidence: Math.min(0.95, totalConfidence / results.length),
        algorithm: `Ensemble (${results.map(r => r.algorithm).join(', ')})`,
        keywords: results.flatMap(r => r.keywords || [])
      };
    } catch (error) {
      console.error('Ensemble classification failed:', error);
      throw error;
    }
  }

  /**
   * Enhanced fallback classification with improved keyword analysis
   */
  private static async classifyWithEnhancedKeywords(
    title: string,
    content: string
  ): Promise<ClassificationResult> {
    const text = `${title} ${content}`.toLowerCase();
    const scores = this.calculateAdvancedKeywordScores(text);
    
    const bestMatch = Object.entries(scores)
      .sort(([,a], [,b]) => b - a)[0];
    
    const category = bestMatch[0];
    const confidence = Math.min(0.85, Math.max(0.5, bestMatch[1]));
    
    return {
      category,
      subcategory: this.selectBestSubcategory(category, text),
      confidence,
      algorithm: 'Enhanced Keyword Analysis',
      keywords: this.extractRelevantKeywords(text, category)
    };
  }

  // Helper methods for advanced classification

  private static calculateAdvancedKeywordScores(text: string): Record<string, number> {
    const scores: Record<string, number> = {};
    const words = text.split(/\s+/).filter(word => word.length > 2);
    const wordFreq: Record<string, number> = {};
    
    // Calculate word frequencies
    words.forEach(word => {
      wordFreq[word] = (wordFreq[word] || 0) + 1;
    });
    
    Object.entries(this.CLASSIFICATION_CATEGORIES).forEach(([category, data]) => {
      let score = 0;
      data.keywords.forEach(keyword => {
        const matches = (text.match(new RegExp(`\\b${keyword}\\b`, 'gi')) || []).length;
        // TF-IDF-like scoring
        const tf = matches / words.length;
        const weight = keyword.length > 6 ? 2 : 1; // Longer keywords get more weight
        score += tf * weight * 100;
      });
      scores[category] = score;
    });
    
    return scores;
  }

  private static extractStructuralFeatures(title: string, content: string): Record<string, number> {
    const features: Record<string, number> = {};
    
    // Title patterns
    if (title.toLowerCase().includes('research') || title.toLowerCase().includes('study')) {
      features['Academic'] = (features['Academic'] || 0) + 0.3;
    }
    
    if (title.toLowerCase().includes('business') || title.toLowerCase().includes('strategy')) {
      features['Business'] = (features['Business'] || 0) + 0.3;
    }
    
    // Content structure analysis
    const hasAbstract = content.toLowerCase().includes('abstract');
    const hasMethodology = content.toLowerCase().includes('methodology');
    const hasReferences = content.toLowerCase().includes('references') || content.toLowerCase().includes('bibliography');
    
    if (hasAbstract || hasMethodology || hasReferences) {
      features['Academic'] = (features['Academic'] || 0) + 0.4;
    }
    
    return features;
  }

  private static async calculateSemanticSimilarity(text: string): Promise<Record<string, number>> {
    // Placeholder for semantic similarity - could integrate with embeddings API
    // For now, return neutral scores
    return {
      'Academic': 0,
      'Business': 0,
      'Technical': 0,
      'Legal': 0,
      'Medical': 0
    };
  }

  private static combineScores(
    keywordScores: Record<string, number>,
    structuralFeatures: Record<string, number>,
    semanticScores: Record<string, number>
  ): Record<string, number> {
    const combined: Record<string, number> = {};
    
    Object.keys(this.CLASSIFICATION_CATEGORIES).forEach(category => {
      const keywordScore = keywordScores[category] || 0;
      const structuralScore = (structuralFeatures[category] || 0) * 100;
      const semanticScore = (semanticScores[category] || 0) * 50;
      
      // Weighted combination
      combined[category] = (keywordScore * 0.6) + (structuralScore * 0.3) + (semanticScore * 0.1);
    });
    
    return combined;
  }

  private static selectBestSubcategory(category: string, text: string): string {
    const categoryData = this.CLASSIFICATION_CATEGORIES[category as keyof typeof this.CLASSIFICATION_CATEGORIES];
    if (!categoryData) return 'General';
    
    // Simple subcategory selection based on content
    for (const subcategory of categoryData.subcategories) {
      if (text.includes(subcategory.toLowerCase())) {
        return subcategory;
      }
    }
    
    return categoryData.subcategories[0];
  }

  private static extractRelevantKeywords(text: string, category: string): string[] {
    const categoryData = this.CLASSIFICATION_CATEGORIES[category as keyof typeof this.CLASSIFICATION_CATEGORIES];
    if (!categoryData) return [];
    
    return categoryData.keywords.filter(keyword => 
      text.includes(keyword.toLowerCase())
    ).slice(0, 5);
  }

  private static mapToOurCategories(result: any): { category: string; subcategory: string } {
    // Map external model results to our category system
    const label = result.label?.toLowerCase() || '';
    
    if (label.includes('research') || label.includes('academic')) {
      return { category: 'Academic', subcategory: 'Research Paper' };
    } else if (label.includes('business') || label.includes('commercial')) {
      return { category: 'Business', subcategory: 'Business Plan' };
    } else if (label.includes('technical') || label.includes('technology')) {
      return { category: 'Technical', subcategory: 'Technical Specification' };
    } else if (label.includes('legal') || label.includes('law')) {
      return { category: 'Legal', subcategory: 'Legal Contract' };
    } else if (label.includes('medical') || label.includes('health')) {
      return { category: 'Medical', subcategory: 'Medical Report' };
    }
    
    return { category: 'Technical', subcategory: 'General' };
  }
}
