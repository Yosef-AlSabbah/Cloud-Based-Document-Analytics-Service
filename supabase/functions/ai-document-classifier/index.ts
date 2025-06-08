
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
const HUGGINGFACE_API_KEY = Deno.env.get('HUGGINGFACE_API_KEY');

interface ClassificationRequest {
  title: string;
  content: string;
  method: 'openai' | 'huggingface';
  model?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { title, content, method, model }: ClassificationRequest = await req.json();
    console.log(`🤖 AI Classification request: ${method} for "${title}"`);

    let result;
    
    switch (method) {
      case 'openai':
        result = await classifyWithOpenAI(title, content, model || 'gpt-4o-mini');
        break;
      case 'huggingface':
        result = await classifyWithHuggingFace(title, content, model || 'facebook/bart-large-mnli');
        break;
      default:
        throw new Error(`Unsupported classification method: ${method}`);
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('❌ Classification error:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Classification failed', 
        details: error.message 
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});

async function classifyWithOpenAI(title: string, content: string, model: string) {
  if (!OPENAI_API_KEY) {
    throw new Error('OpenAI API key not configured');
  }

  const prompt = `Classify the following document into one of these categories: Academic, Business, Technical, Legal, Medical.

Also provide:
1. A specific subcategory
2. Confidence score (0-1)
3. Top 5 relevant keywords that led to this classification

Document Title: ${title}

Document Content: ${content.substring(0, 1500)}

Respond with a JSON object in this exact format:
{
  "category": "category_name",
  "subcategory": "specific_subcategory",
  "confidence": 0.85,
  "keywords": ["keyword1", "keyword2", "keyword3", "keyword4", "keyword5"],
  "reasoning": "brief explanation"
}`;

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      messages: [
        {
          role: 'system',
          content: 'You are an expert document classifier. Respond only with valid JSON.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.1,
      max_tokens: 300
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenAI API error: ${response.statusText}`);
  }

  const data = await response.json();
  const content_text = data.choices[0].message.content;
  
  try {
    const result = JSON.parse(content_text);
    console.log('✅ OpenAI classification result:', result);
    return result;
  } catch (error) {
    console.error('Failed to parse OpenAI response:', content_text);
    throw new Error('Invalid JSON response from OpenAI');
  }
}

async function classifyWithHuggingFace(title: string, content: string, model: string) {
  if (!HUGGINGFACE_API_KEY) {
    throw new Error('Hugging Face API key not configured');
  }

  const text = `${title} ${content}`.substring(0, 1000);
  const categories = ['Academic', 'Business', 'Technical', 'Legal', 'Medical'];
  
  // Use zero-shot classification with BART
  const response = await fetch(`https://api-inference.huggingface.co/models/${model}`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${HUGGINGFACE_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      inputs: text,
      parameters: {
        candidate_labels: categories
      }
    }),
  });

  if (!response.ok) {
    throw new Error(`Hugging Face API error: ${response.statusText}`);
  }

  const data = await response.json();
  console.log('🤗 Hugging Face raw result:', data);

  const category = data.labels[0];
  const confidence = data.scores[0];
  
  // Extract keywords (simplified approach)
  const keywords = extractKeywords(text, category);
  
  const result = {
    category,
    subcategory: mapToSubcategory(category, text),
    confidence: Math.round(confidence * 100) / 100,
    keywords,
    reasoning: `Classified using ${model} with ${(confidence * 100).toFixed(1)}% confidence`
  };

  console.log('✅ Hugging Face classification result:', result);
  return result;
}

function extractKeywords(text: string, category: string): string[] {
  const categoryKeywords = {
    'Academic': ['research', 'study', 'analysis', 'methodology', 'findings', 'academic', 'paper', 'journal'],
    'Business': ['business', 'strategy', 'market', 'revenue', 'profit', 'financial', 'commercial', 'enterprise'],
    'Technical': ['technical', 'system', 'software', 'algorithm', 'implementation', 'architecture', 'development'],
    'Legal': ['legal', 'law', 'contract', 'agreement', 'policy', 'compliance', 'regulation', 'terms'],
    'Medical': ['medical', 'health', 'patient', 'clinical', 'diagnosis', 'treatment', 'healthcare', 'pharmaceutical']
  };

  const relevantKeywords = categoryKeywords[category as keyof typeof categoryKeywords] || [];
  const foundKeywords = relevantKeywords.filter(keyword => 
    text.toLowerCase().includes(keyword)
  );

  return foundKeywords.slice(0, 5);
}

function mapToSubcategory(category: string, text: string): string {
  const subcategoryMappings = {
    'Academic': {
      'Research Paper': ['research', 'findings', 'methodology'],
      'Thesis': ['thesis', 'dissertation'],
      'Journal Article': ['journal', 'publication'],
      'Conference Paper': ['conference', 'proceedings'],
      'Technical Report': ['report', 'technical']
    },
    'Business': {
      'Business Plan': ['plan', 'strategy'],
      'Financial Report': ['financial', 'revenue', 'profit'],
      'Market Analysis': ['market', 'analysis'],
      'Contract': ['contract', 'agreement'],
      'Proposal': ['proposal', 'bid']
    },
    'Technical': {
      'API Documentation': ['api', 'documentation'],
      'System Design': ['system', 'architecture'],
      'Software Manual': ['manual', 'guide'],
      'Technical Specification': ['specification', 'requirements'],
      'Code Documentation': ['code', 'programming']
    },
    'Legal': {
      'Legal Contract': ['contract', 'agreement'],
      'Policy Document': ['policy', 'procedure'],
      'Compliance Report': ['compliance', 'audit'],
      'Terms of Service': ['terms', 'service'],
      'Legal Brief': ['brief', 'case']
    },
    'Medical': {
      'Clinical Study': ['clinical', 'study'],
      'Medical Report': ['report', 'diagnosis'],
      'Patient Record': ['patient', 'record'],
      'Pharmaceutical Research': ['pharmaceutical', 'drug'],
      'Healthcare Policy': ['healthcare', 'policy']
    }
  };

  const mappings = subcategoryMappings[category as keyof typeof subcategoryMappings];
  if (!mappings) return 'General';

  for (const [subcategory, keywords] of Object.entries(mappings)) {
    if (keywords.some(keyword => text.toLowerCase().includes(keyword))) {
      return subcategory;
    }
  }

  return Object.keys(mappings)[0]; // Return first subcategory as default
}
