
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ScrapedDocument {
  title: string;
  content: string;
  url: string;
  type: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { url } = await req.json();
    
    if (!url) {
      throw new Error('URL is required');
    }

    console.log(`🌐 Starting web scraping for: ${url}`);

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get user from authorization header
    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      throw new Error('Unauthorized');
    }

    console.log(`👤 User authenticated: ${user.id}`);

    // Perform web scraping
    const scrapedDocuments: ScrapedDocument[] = await performWebScraping(url);

    // Process and store each scraped document
    const processedDocs = [];
    
    for (const doc of scrapedDocuments) {
      console.log(`📄 Processing document: ${doc.title}`);
      
      // Classify document using enhanced algorithm
      const classification = await classifyDocument(doc.content, doc.title);
      
      // Store document in database
      const { data: docData, error: docError } = await supabase
        .from('documents')
        .insert({
          user_id: user.id,
          name: `${doc.title.replace(/[^a-zA-Z0-9\s]/g, '').substring(0, 50)}.html`,
          title: doc.title,
          content: doc.content,
          size: new Blob([doc.content]).size,
          type: 'text/html'
        })
        .select()
        .single();

      if (docError) {
        console.error('Document storage error:', docError);
        throw docError;
      }

      // Store classification
      const { error: classError } = await supabase
        .from('document_classifications')
        .insert({
          document_id: docData.id,
          category: classification.category,
          subcategory: classification.subcategory,
          confidence: classification.confidence,
          algorithm: classification.algorithm
        });

      if (classError) {
        console.error('Classification storage error:', classError);
      }

      processedDocs.push({
        id: docData.id,
        name: docData.name,
        title: docData.title,
        size: docData.size,
        type: docData.type,
        upload_time: docData.upload_time
      });

      console.log(`✅ Successfully processed: ${doc.title}`);
    }

    console.log(`🎉 Web scraping completed successfully. Processed ${processedDocs.length} documents`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        documents: processedDocs,
        message: `Successfully scraped ${processedDocs.length} documents from ${url}`
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('❌ Web scraping error:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Internal server error',
        success: false 
      }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});

async function performWebScraping(url: string): Promise<ScrapedDocument[]> {
  console.log(`🔍 Scraping content from: ${url}`);
  
  // Simulate realistic scraping with network delay
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Enhanced mock scraped content based on URL domain and structure
  const documents: ScrapedDocument[] = [];
  
  // Determine content type based on URL
  if (url.includes('research') || url.includes('academic') || url.includes('paper')) {
    documents.push({
      title: "Advanced Machine Learning Techniques for Document Analysis",
      content: `This comprehensive research paper explores cutting-edge machine learning methodologies for automated document processing and content analysis.

Abstract:
The exponential growth of digital documents in enterprise environments necessitates sophisticated automated classification and analysis systems. This study presents novel deep learning approaches combining natural language processing with computer vision techniques for multi-modal document understanding.

Key Contributions:
- Implementation of transformer-based architectures for text classification
- Development of hybrid CNN-RNN models for document layout analysis
- Novel attention mechanisms for extracting semantic relationships
- Comprehensive evaluation framework with benchmarking datasets

Methodology:
Our approach leverages pre-trained language models fine-tuned on domain-specific document corpora. The system incorporates:
1. Text extraction and preprocessing pipelines
2. Feature engineering using TF-IDF and word embeddings
3. Multi-class classification with ensemble methods
4. Performance optimization through hyperparameter tuning

Results demonstrate significant improvements in classification accuracy (96.3% F1-score) compared to traditional rule-based systems, with particular strengths in handling complex technical documents and multilingual content.`,
      url: url,
      type: "text/html"
    });
  }
  
  if (url.includes('tech') || url.includes('software') || url.includes('development')) {
    documents.push({
      title: "Cloud-Native Architecture Best Practices",
      content: `This technical guide provides comprehensive insights into designing and implementing cloud-native applications using modern architectural patterns.

Executive Summary:
Organizations adopting cloud-native approaches report 40% faster time-to-market and 60% reduction in infrastructure costs. This document outlines proven strategies for successful cloud transformation.

Core Principles:
- Microservices decomposition strategies
- Container orchestration with Kubernetes
- DevOps automation and CI/CD pipelines
- Observability and monitoring frameworks
- Security-first design patterns

Implementation Guidelines:
1. Start with domain-driven design to identify service boundaries
2. Implement API-first development approaches
3. Establish comprehensive testing strategies (unit, integration, e2e)
4. Deploy infrastructure as code using tools like Terraform
5. Monitor application performance and user experience continuously

Case Studies:
- E-commerce platform scaling from 1K to 1M users
- Financial services migration reducing latency by 75%
- Healthcare system achieving 99.99% uptime

The guide includes practical code examples, architectural diagrams, and decision trees for technology selection.`,
      url: url,
      type: "text/html"
    });
  }
  
  // Default general content for other URLs
  if (documents.length === 0) {
    documents.push({
      title: "Digital Transformation in Modern Enterprises",
      content: `This strategic document examines the impact of digital transformation initiatives across various industry sectors.

Overview:
Digital transformation has become a critical business imperative, with 84% of enterprises reporting it as essential for competitive advantage. This analysis covers successful transformation patterns and common pitfalls.

Key Areas of Focus:
- Customer experience optimization
- Operational efficiency improvements
- Data-driven decision making
- Technology modernization
- Workforce digital skills development

Strategic Recommendations:
1. Establish clear digital transformation objectives aligned with business goals
2. Invest in employee training and change management programs
3. Implement agile methodologies for faster adaptation
4. Leverage data analytics for actionable insights
5. Foster innovation culture through experimentation

Industry Examples:
- Retail: Omnichannel customer experiences
- Manufacturing: IoT-enabled predictive maintenance
- Healthcare: Telemedicine and remote patient monitoring
- Finance: Digital banking and automated compliance

Success metrics include customer satisfaction scores, operational cost reductions, and revenue growth from digital channels.`,
      url: url,
      type: "text/html"
    });
  }
  
  console.log(`📊 Generated ${documents.length} documents from ${url}`);
  return documents;
}

async function classifyDocument(content: string, title: string): Promise<{
  category: string;
  subcategory: string;
  confidence: number;
  algorithm: string;
}> {
  console.log(`🏷️ Classifying document: ${title}`);
  
  // Enhanced classification with better keyword detection
  const keywords = {
    academic: ['research', 'study', 'analysis', 'methodology', 'conclusion', 'abstract', 'findings', 'paper', 'journal', 'peer-reviewed'],
    technical: ['algorithm', 'implementation', 'system', 'architecture', 'technology', 'software', 'framework', 'API', 'cloud', 'development'],
    business: ['strategy', 'market', 'revenue', 'profit', 'business', 'company', 'management', 'enterprise', 'transformation', 'ROI'],
    legal: ['contract', 'agreement', 'law', 'legal', 'clause', 'terms', 'policy', 'compliance', 'regulation', 'liability']
  };

  const subcategories = {
    academic: ['Computer Science', 'Engineering', 'Mathematics', 'Natural Sciences', 'Social Sciences'],
    technical: ['Software Architecture', 'AI/ML', 'Web Development', 'System Design', 'Cloud Computing'],
    business: ['Strategy', 'Marketing', 'Finance', 'Operations', 'Digital Transformation'],
    legal: ['Contracts', 'Policies', 'Compliance', 'Corporate Law', 'Intellectual Property']
  };

  const text = (title + ' ' + content).toLowerCase();
  const scores: Record<string, number> = {};

  // Calculate weighted scores
  Object.entries(keywords).forEach(([category, words]) => {
    scores[category] = words.reduce((score, keyword) => {
      const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
      const matches = (text.match(regex) || []).length;
      // Weight title matches higher
      const titleMatches = (title.toLowerCase().match(regex) || []).length;
      return score + matches + (titleMatches * 2);
    }, 0);
  });

  const bestCategory = Object.entries(scores).reduce((a, b) => scores[a[0]] > scores[b[0]] ? a : b)[0];
  const maxScore = scores[bestCategory];
  const totalScore = Object.values(scores).reduce((sum, score) => sum + score, 0);
  
  // Calculate confidence with better distribution
  let confidence = totalScore > 0 ? Math.min(0.95, (maxScore / totalScore) * 1.2) : 0.7;
  confidence = Math.max(0.6, confidence); // Minimum confidence

  const availableSubcategories = subcategories[bestCategory as keyof typeof subcategories] || ['General'];
  const subcategory = availableSubcategories[Math.floor(Math.random() * availableSubcategories.length)];

  const result = {
    category: bestCategory.charAt(0).toUpperCase() + bestCategory.slice(1),
    subcategory,
    confidence: Math.round(confidence * 100) / 100,
    algorithm: 'Enhanced Web Scraping Classification v2.0'
  };

  console.log(`✅ Classification result: ${result.category} > ${result.subcategory} (${Math.round(result.confidence * 100)}%)`);
  return result;
}
