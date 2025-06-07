import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

// Define CORS headers
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
};

// Define types for scraped documents
interface ScrapedDocument {
  title: string;
  content: string;
  url: string;
  type: string;
}

interface DocumentClassification {
  category: string;
  subcategory: string;
  confidence: number;
  algorithm: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { url } = await req.json();
    
    if (!url) {
      console.error('❌ No URL provided');
      throw new Error('URL is required');
    }

    console.log(`🕸️ Starting web scraping for: ${url}`);

    // Validate URL format
    let urlObject;
    try {
      urlObject = new URL(url);
    } catch {
      console.error('❌ Invalid URL format:', url);
      throw new Error('Invalid URL format. Please provide a valid web address (e.g., https://example.com)');
    }

    // Get authenticated user
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error('❌ No authorization header found');
      throw new Error('Authentication required. Please log in to use web scraping.');
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: {
            Authorization: authHeader,
          },
        },
      }
    );

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      console.error('❌ User authentication failed:', userError);
      throw new Error('User not authenticated. Please log in and try again.');
    }

    console.log(`👤 Processing for user: ${user.id}`);

    // Check if the URL is accessible
    console.log(`🌐 Attempting to fetch: ${url}`);

    // Fetch the webpage with improved error handling
    let response: Response;
    try {
      response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
          'Accept-Encoding': 'gzip, deflate',
          'Connection': 'keep-alive',
          'Sec-Fetch-Dest': 'document',
          'Sec-Fetch-Mode': 'navigate',
          'Sec-Fetch-Site': 'none',
        },
        signal: AbortSignal.timeout(30000), // 30 second timeout
      });
    } catch (fetchError) {
      console.error('❌ Network error during fetch:', fetchError);
      
      if (fetchError.name === 'TimeoutError') {
        throw new Error(`The website took too long to respond. This might be due to: 1) The site being slow or down, 2) Network connectivity issues, or 3) The site blocking automated requests.`);
      }
      
      throw new Error(`Failed to access the website. This could be because: 1) The URL is incorrect, 2) The site is down, 3) The site blocks automated requests, or 4) Network connectivity issues. Original error: ${fetchError.message}`);
    }

    console.log(`📡 Response status: ${response.status} ${response.statusText}`);

    if (!response.ok) {
      const errorDetails = {
        400: 'Bad request - The URL might be malformed',
        401: 'Unauthorized - The site requires authentication',
        403: 'Forbidden - The site blocks automated access',
        404: 'Not found - The page does not exist',
        429: 'Too many requests - The site is rate limiting',
        500: 'Server error - The website is experiencing issues',
        503: 'Service unavailable - The website is temporarily down'
      };
      
      const errorMessage = errorDetails[response.status as keyof typeof errorDetails] 
        || `HTTP ${response.status}: ${response.statusText}`;
      
      throw new Error(`Cannot access the website (${errorMessage}). Please check the URL and try again.`);
    }

    const contentType = response.headers.get('content-type') || '';
    console.log(`📄 Content type: ${contentType}`);

    if (!contentType.includes('text/html')) {
      throw new Error(`This appears to be a ${contentType} file, not a web page. Web scraping is designed for HTML pages containing text content. For direct file downloads, please use the document upload feature instead.`);
    }

    const html = await response.text();
    console.log(`📄 Downloaded ${html.length} characters of HTML`);

    if (html.length < 100) {
      throw new Error('The webpage appears to be empty or contains very little content. This might be a dynamic page that loads content with JavaScript, which is not supported by this scraper.');
    }

    // Enhanced document extraction
    const documents = await extractDocumentsFromHTML(html, url);
    console.log(`📚 Found ${documents.length} potential documents`);

    if (documents.length === 0) {
      throw new Error('No readable content found on this page. This might be because: 1) The page is mostly images/videos, 2) Content is loaded dynamically with JavaScript, or 3) The page structure is not compatible with our scraper.');
    }

    // Process and store documents
    const processedDocuments = [];
    
    for (const doc of documents) {
      try {
        console.log(`🔄 Processing document: ${doc.title || doc.url}`);
        
        // Generate a unique document ID
        const documentId = crypto.randomUUID();
        
        // Enhanced content generation with better context
        const enhancedContent = await generateEnhancedContent(doc, url);
        
        // Classify the document with improved algorithm
        const classification = await classifyDocument(enhancedContent, doc.title || '');
        
        // Store in database with comprehensive metadata
        const documentData = {
          id: documentId,
          user_id: user.id,
          name: doc.title || `Scraped content from ${urlObject.hostname}`,
          title: doc.title || `Content from ${urlObject.hostname}`,
          content: enhancedContent,
          size: enhancedContent.length,
          type: 'text/html',
          file_path: null,
          upload_time: new Date().toISOString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        const { error: insertError } = await supabase
          .from('documents')
          .insert(documentData);

        if (insertError) {
          console.error('❌ Error inserting document:', insertError);
          continue;
        }

        // Store classification
        if (classification) {
          const { error: classError } = await supabase
            .from('document_classifications')
            .insert({
              document_id: documentId,
              category: classification.category,
              subcategory: classification.subcategory,
              confidence: classification.confidence,
              algorithm: classification.algorithm
            });

          if (classError) {
            console.warn('⚠️ Error storing classification:', classError);
          }
        }

        processedDocuments.push({
          id: documentId,
          name: documentData.name,
          title: documentData.title,
          content: enhancedContent.substring(0, 500), // Truncate for response
          size: enhancedContent.length,
          type: 'text/html',
          upload_time: documentData.upload_time,
        });

        console.log(`✅ Successfully processed: ${doc.title || 'Untitled'}`);
        
      } catch (docError) {
        console.error(`❌ Error processing document ${doc.title}:`, docError);
        continue;
      }
    }

    if (processedDocuments.length === 0) {
      throw new Error('Failed to process any documents from the webpage. The content might be incompatible with our processing system.');
    }

    console.log(`🎉 Web scraping completed. Processed ${processedDocuments.length} documents`);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Successfully scraped and processed ${processedDocuments.length} documents from ${urlObject.hostname}`,
        documents: processedDocuments,
        stats: {
          found: documents.length,
          processed: processedDocuments.length,
          source_url: url,
          source_domain: urlObject.hostname
        }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('❌ Web scraping error:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Web scraping failed',
        details: 'Please check the URL and try again. Make sure it\'s a publicly accessible webpage containing text content.',
        supportedTypes: 'This tool works best with news articles, blog posts, documentation pages, and other text-heavy websites.',
        limitations: 'Cannot scrape: password-protected sites, JavaScript-heavy apps, direct file downloads, or pages that block automated access.'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});

async function extractDocumentsFromHTML(html: string, baseUrl: string): Promise<ScrapedDocument[]> {
  const documents: ScrapedDocument[] = [];
  
  try {
    // Enhanced regex patterns for better content extraction
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    const pageTitle = titleMatch ? titleMatch[1].trim() : '';

    // Extract meta description
    const descMatch = html.match(/<meta[^>]*name=["\']description["\'][^>]*content=["\']([^"']+)["\'][^>]*>/i);
    const metaDescription = descMatch ? descMatch[1].trim() : '';

    // Extract main content using multiple strategies
    let mainContent = '';
    
    // Strategy 1: Look for main content areas
    const mainContentPatterns = [
      /<main[^>]*>([\s\S]*?)<\/main>/i,
      /<article[^>]*>([\s\S]*?)<\/article>/i,
      /<div[^>]*class=["\'][^"']*content[^"']*["\'][^>]*>([\s\S]*?)<\/div>/i,
      /<div[^>]*id=["\'][^"']*content[^"']*["\'][^>]*>([\s\S]*?)<\/div>/i,
    ];

    for (const pattern of mainContentPatterns) {
      const match = html.match(pattern);
      if (match && match[1]) {
        mainContent = match[1];
        break;
      }
    }

    // Strategy 2: If no main content found, extract from body
    if (!mainContent) {
      const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
      if (bodyMatch) {
        mainContent = bodyMatch[1];
      }
    }

    // Clean HTML and extract text
    const cleanContent = cleanHtmlContent(mainContent || html);
    
    // Extract headings for better structure
    const headings = extractHeadings(html);
    
    // Extract paragraphs
    const paragraphs = extractParagraphs(mainContent || html);
    
    // Combine all content intelligently
    const combinedContent = [
      pageTitle,
      metaDescription,
      ...headings,
      ...paragraphs,
      cleanContent
    ].filter(Boolean).join('\n\n');

    // Create main document
    documents.push({
      title: pageTitle || `Content from ${new URL(baseUrl).hostname}`,
      content: combinedContent.substring(0, 10000), // Limit content size
      url: baseUrl,
      type: 'webpage'
    });

    // Look for additional downloadable documents
    const downloadablePatterns = [
      /<a[^>]*href=["\']([^"']*\.pdf)["\'][^>]*>([^<]*)<\/a>/gi,
      /<a[^>]*href=["\']([^"']*\.docx?)["\'][^>]*>([^<]*)<\/a>/gi,
      /<a[^>]*href=["\']([^"']*\.txt)["\'][^>]*>([^<]*)<\/a>/gi,
    ];

    for (const pattern of downloadablePatterns) {
      let match;
      while ((match = pattern.exec(html)) !== null) {
        const [, href, linkText] = match;
        const fullUrl = new URL(href, baseUrl).toString();
        
        documents.push({
          title: linkText.trim() || `Document from ${href}`,
          content: `Downloadable document: ${linkText.trim()}\nURL: ${fullUrl}`,
          url: fullUrl,
          type: 'document_link'
        });
      }
    }

    console.log(`📋 Extracted ${documents.length} documents from HTML`);
    return documents;

  } catch (error) {
    console.error('❌ Error extracting documents from HTML:', error);
    return [{
      title: `Scraped content from ${new URL(baseUrl).hostname}`,
      content: html.substring(0, 5000), // Fallback to raw HTML
      url: baseUrl,
      type: 'raw_html'
    }];
  }
}

function cleanHtmlContent(html: string): string {
  return html
    // Remove script and style elements
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<noscript[^>]*>[\s\S]*?<\/noscript>/gi, '')
    // Remove HTML comments
    .replace(/<!--[\s\S]*?-->/g, '')
    // Remove HTML tags but keep content
    .replace(/<[^>]+>/g, ' ')
    // Clean up whitespace
    .replace(/\s+/g, ' ')
    .replace(/\n\s*\n/g, '\n')
    .trim();
}

function extractHeadings(html: string): string[] {
  const headings: string[] = [];
  for (let level = 1; level <= 6; level++) {
    const regex = new RegExp(`<h${level}[^>]*>([^<]+)</h${level}>`, 'gi');
    let match;
    while ((match = regex.exec(html)) !== null) {
      if (match[1] && match[1].trim()) {
        headings.push(match[1].trim());
      }
    }
  }
  return headings;
}

function extractParagraphs(html: string): string[] {
  const paragraphs: string[] = [];
  const regex = /<p[^>]*>([^<]+(?:<[^p][^>]*>[^<]*<\/[^p][^>]*>[^<]*)*)<\/p>/gi;
  let match;
  while ((match = regex.exec(html)) !== null) {
    if (match[1]) {
      const cleanParagraph = cleanHtmlContent(match[1]);
      if (cleanParagraph.length > 20) { // Only include substantial paragraphs
        paragraphs.push(cleanParagraph);
      }
    }
  }
  return paragraphs;
}

async function generateEnhancedContent(doc: ScrapedDocument, sourceUrl: string): Promise<string> {
  const timestamp = new Date().toISOString();
  const hostname = new URL(sourceUrl).hostname;
  
  return [
    `Document Title: ${doc.title}`,
    `Source: ${hostname}`,
    `Scraped: ${timestamp}`,
    `Type: ${doc.type}`,
    '',
    'Content:',
    doc.content,
    '',
    `Original URL: ${doc.url}`,
    '',
    'This document was automatically collected via web scraping and processed for search and analysis.',
  ].join('\n');
}

async function classifyDocument(content: string, title: string): Promise<DocumentClassification | null> {
  try {
    // Enhanced classification logic
    const text = (title + ' ' + content).toLowerCase();
    
    // Define classification categories with better patterns
    const categories = {
      'Academic': {
        patterns: ['research', 'study', 'analysis', 'paper', 'journal', 'academic', 'university', 'education', 'thesis', 'dissertation'],
        subcategories: ['Research Paper', 'Thesis', 'Academic Article', 'Educational Material']
      },
      'Business': {
        patterns: ['business', 'company', 'corporate', 'financial', 'market', 'strategy', 'management', 'report', 'proposal'],
        subcategories: ['Business Report', 'Financial Document', 'Strategy Document', 'Proposal']
      },
      'Technical': {
        patterns: ['technical', 'software', 'development', 'programming', 'system', 'architecture', 'documentation', 'manual', 'guide'],
        subcategories: ['Technical Documentation', 'Software Manual', 'System Guide', 'API Documentation']
      },
      'Legal': {
        patterns: ['legal', 'law', 'contract', 'agreement', 'terms', 'policy', 'regulation', 'compliance'],
        subcategories: ['Contract', 'Policy Document', 'Legal Agreement', 'Compliance Document']
      },
      'News': {
        patterns: ['news', 'article', 'press', 'announcement', 'update', 'breaking', 'story', 'journalism'],
        subcategories: ['News Article', 'Press Release', 'Blog Post', 'Editorial']
      }
    };

    let bestMatch = { category: 'General', subcategory: 'Web Content', confidence: 0.3 };

    for (const [category, info] of Object.entries(categories)) {
      let score = 0;
      const matchedPatterns: string[] = [];

      for (const pattern of info.patterns) {
        const regex = new RegExp(pattern, 'gi');
        const matches = text.match(regex);
        if (matches) {
          score += matches.length;
          matchedPatterns.push(pattern);
        }
      }

      // Normalize score based on content length
      const normalizedScore = score / (content.length / 1000 + 1);
      
      if (normalizedScore > bestMatch.confidence) {
        bestMatch = {
          category,
          subcategory: info.subcategories[0] || 'General',
          confidence: Math.min(0.95, normalizedScore)
        };
      }
    }

    return {
      category: bestMatch.category,
      subcategory: bestMatch.subcategory,
      confidence: bestMatch.confidence,
      algorithm: 'Enhanced Web Content Classification v2.1'
    };

  } catch (error) {
    console.error('❌ Classification error:', error);
    return {
      category: 'General',
      subcategory: 'Web Content',
      confidence: 0.5,
      algorithm: 'Fallback Classification'
    };
  }
}
