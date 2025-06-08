// -------------------------------------------------------------
// Cloud-Based-Document-Analytics-Service
// Author: Yousef M. Y. Al Sabbah
// https://github.com/Yosef-AlSabbah/Cloud-Based-Document-Analytics-Service
// -------------------------------------------------------------

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { FileText, Upload, Calendar, TrendingUp } from "lucide-react";

interface AnalyticsDashboardProps {
  documents: any[];
}

const AnalyticsDashboard = ({ documents }: AnalyticsDashboardProps) => {
  // Helper function to convert MIME types to human-readable formats
  const formatFileType = (mimeType: string): string => {
    const typeMap: { [key: string]: string } = {
      'application/pdf': 'PDF',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'DOCX',
      'application/msword': 'DOC',
      'text/plain': 'TXT',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'XLSX',
      'application/vnd.ms-excel': 'XLS',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'PPTX',
      'application/vnd.ms-powerpoint': 'PPT',
      'image/jpeg': 'JPEG',
      'image/png': 'PNG',
      'image/gif': 'GIF',
      'application/zip': 'ZIP',
      'application/x-rar-compressed': 'RAR'
    };
    
    return typeMap[mimeType] || mimeType.split('/').pop()?.toUpperCase() || 'Unknown';
  };

  // Helper function to get category from classification or infer from document
  const getDocumentCategory = (doc: any): string => {
    // First check if document has classification
    if (doc.document_classifications && doc.document_classifications.length > 0) {
      return doc.document_classifications[0].category;
    }
    
    // If no classification, try to infer from title/content keywords
    const title = (doc.title || '').toLowerCase();
    const content = (doc.content || '').toLowerCase();
    const text = `${title} ${content}`;
    
    if (text.includes('financial') || text.includes('budget') || text.includes('invoice') || text.includes('payment')) {
      return 'Business & Finance';
    } else if (text.includes('technical') || text.includes('software') || text.includes('code') || text.includes('programming')) {
      return 'Technology';
    } else if (text.includes('research') || text.includes('study') || text.includes('analysis') || text.includes('academic')) {
      return 'Research & Academic';
    } else if (text.includes('legal') || text.includes('contract') || text.includes('agreement') || text.includes('policy')) {
      return 'Legal & Compliance';
    } else if (text.includes('report') || text.includes('summary') || text.includes('meeting') || text.includes('minutes')) {
      return 'Reports & Documentation';
    } else {
      return 'General';
    }
  };

  // Data processing for charts
  const totalDocuments = documents.length;
  const totalSize = documents.reduce((sum, doc) => sum + (doc.size || 0), 0);
  const avgSize = totalDocuments > 0 ? totalSize / totalDocuments : 0;

  // Document types distribution with human-readable formats
  const typeData = documents.reduce((acc, doc) => {
    const type = formatFileType(doc.type || 'Unknown');
    acc[type] = (acc[type] || 0) + 1;
    return acc;
  }, {});

  const pieData = Object.entries(typeData).map(([type, count]) => ({
    name: type,
    value: count as number
  }));

  // Upload trends (generate from actual upload dates)
  const generateTrendData = () => {
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const now = new Date();
    const trendData = [];
    
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      const uploadsInMonth = documents.filter(doc => {
        const docDate = new Date(doc.created_at || doc.upload_time);
        const docMonthKey = `${docDate.getFullYear()}-${String(docDate.getMonth() + 1).padStart(2, '0')}`;
        return docMonthKey === monthKey;
      }).length;
      
      trendData.push({
        month: monthNames[date.getMonth()],
        uploads: uploadsInMonth
      });
    }
    
    return trendData;
  };

  const trendData = generateTrendData();

  // Category distribution with improved classification
  const categoryData = documents.reduce((acc, doc) => {
    const category = getDocumentCategory(doc);
    acc[category] = (acc[category] || 0) + 1;
    return acc;
  }, {});

  const barData = Object.entries(categoryData).map(([category, count]) => ({
    category: category.length > 15 ? category.substring(0, 15) + '...' : category,
    fullCategory: category,
    documents: count as number
  }));

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899', '#14b8a6'];

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Custom tooltip for charts
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background p-3 border border-border rounded-md shadow-md">
          <p className="text-sm font-medium text-foreground">{payload[0].name || label}</p>
          <p className="text-xs text-muted-foreground">
            {payload[0].dataKey}: {payload[0].value}
          </p>
          {payload[0].payload?.fullCategory && (
            <p className="text-xs text-muted-foreground">
              {payload[0].payload.fullCategory}
            </p>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="glass-card border-border/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-foreground">Total Documents</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{totalDocuments}</div>
            <p className="text-xs text-muted-foreground">Documents in your collection</p>
          </CardContent>
        </Card>

        <Card className="glass-card border-border/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-foreground">Total Size</CardTitle>
            <Upload className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{formatBytes(totalSize)}</div>
            <p className="text-xs text-muted-foreground">Storage used</p>
          </CardContent>
        </Card>

        <Card className="glass-card border-border/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-foreground">Average Size</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{formatBytes(avgSize)}</div>
            <p className="text-xs text-muted-foreground">Per document</p>
          </CardContent>
        </Card>

        <Card className="glass-card border-border/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-foreground">Categories</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{Object.keys(categoryData).length}</div>
            <p className="text-xs text-muted-foreground">Document categories</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Distribution */}
        <Card className="glass-card border-border/50">
          <CardHeader>
            <CardTitle className="text-foreground">Documents by Category</CardTitle>
            <CardDescription className="text-muted-foreground">Distribution of documents across categories</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={barData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis 
                  dataKey="category" 
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="documents" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* File Types */}
        <Card className="glass-card border-border/50">
          <CardHeader>
            <CardTitle className="text-foreground">File Types</CardTitle>
            <CardDescription className="text-muted-foreground">Distribution by file format</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Upload Trends */}
      <Card className="glass-card border-border/50">
        <CardHeader>
          <CardTitle className="text-foreground">Upload Trends</CardTitle>
          <CardDescription className="text-muted-foreground">Document uploads over time</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis 
                dataKey="month" 
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
              />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
              <Tooltip content={<CustomTooltip />} />
              <Line 
                type="monotone" 
                dataKey="uploads" 
                stroke="hsl(var(--primary))" 
                strokeWidth={2}
                dot={{ fill: 'hsl(var(--primary))' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
};

export default AnalyticsDashboard;
