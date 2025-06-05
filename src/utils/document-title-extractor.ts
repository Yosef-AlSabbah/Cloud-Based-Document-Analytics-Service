import { supabase } from "@/integrations/supabase/client";
import * as pdfjs from 'pdfjs-dist';
import { getDocument, GlobalWorkerOptions, PDFDocumentProxy } from 'pdfjs-dist';
import mammoth from 'mammoth';
import { PDFDocument } from 'pdf-lib';

// Configure PDF.js worker
GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

export class DocumentTitleExtractor {
    /**
     * Extract the title from a document file - main entry point
     */
    static async getDocumentTitle(file: File): Promise<string | null> {
        console.log(`🔍 Extracting title from: ${file.name}`);

        // Get file extension and mime type
        const extension = this.getFileExtension(file.name).toLowerCase();
        const mimeType = file.type;

        console.log(`📄 File type: ${extension}, MIME: ${mimeType}`);

        try {
            // Extract title based on file type - enhanced with more robust extraction
            if (extension === '.pdf' || mimeType === 'application/pdf') {
                return await this.extractTitleFromPDF(file);
            } else if (['.docx', '.doc'].includes(extension) ||
                mimeType.includes('word') ||
                mimeType.includes('document')) {
                return await this.extractTitleFromDocx(file);
            } else if (['.html', '.htm'].includes(extension) || mimeType === 'text/html') {
                return await this.extractTitleFromHtml(file);
            } else if (extension === '.epub' || mimeType === 'application/epub+zip') {
                return await this.extractTitleFromEpub(file);
            } else if (extension === '.txt' || mimeType === 'text/plain') {
                return await this.extractTitleFromText(file);
            } else {
                console.log(`❌ Unsupported file type: ${extension} (${mimeType})`);
                return null;
            }
        } catch (error) {
            console.error(`❌ Error extracting title: ${error}`);
            return null;
        }
    }

    /**
     * Extract title from PDF metadata or content - enhanced with multiple approaches
     */
    private static async extractTitleFromPDF(file: File): Promise<string | null> {
        try {
            console.log("📄 Processing PDF document");

            // First attempt: Using pdf-lib for more accurate metadata extraction
            try {
                const arrayBuffer = await this.readFileAsArrayBuffer(file);
                const pdfDoc = await PDFDocument.load(arrayBuffer);

                const title = pdfDoc.getTitle();
                if (title) {
                    console.log(`✅ PDF title from pdf-lib: "${title}"`);
                    return title.trim();
                }
            } catch (pdfLibError) {
                console.warn("⚠️ Could not extract title with pdf-lib:", pdfLibError);
            }

            // Second attempt: Using PDF.js
            const pdfDoc = await this.loadPDF(file);

            // Try to get from metadata
            try {
                const metadata = await pdfDoc.getMetadata();
                if (metadata?.info && 'Title' in metadata.info && metadata.info.Title && typeof metadata.info.Title === 'string' && metadata.info.Title.trim()) {
                    const title = metadata.info.Title.trim();
                    console.log(`✅ PDF title from PDF.js metadata: "${title}"`);
                    return title;
                }
            } catch (metadataError) {
                console.warn("⚠️ Could not extract PDF metadata:", metadataError);
            }

            // If no metadata title, try first page text with enhanced detection
            if (pdfDoc.numPages > 0) {
                const firstPage = await pdfDoc.getPage(1);
                const textContent = await firstPage.getTextContent();
                const text = textContent.items.map((item: any) => item.str).join(' ');

                // Look for lines that might be titles (first non-empty lines or lines with larger font)
                const lines = text.trim().split('\n');

                // Track font sizes to identify potential title (larger font at beginning)
                const largestFontSize = this.findLargestFontInFirstPage(textContent);

                // Find lines with the largest font size, potential title candidates
                const potentialTitles = this.extractPotentialTitles(textContent, largestFontSize);
                if (potentialTitles.length > 0) {
                    console.log(`✅ PDF title from largest font: "${potentialTitles[0]}"`);
                    return potentialTitles[0];
                }

                // Fallback: use first non-empty line
                for (const line of lines) {
                    const cleanLine = line.trim();
                    if (cleanLine && cleanLine.length > 3) {
                        console.log(`✅ PDF title from first page: "${cleanLine}"`);
                        return cleanLine;
                    }
                }
            }

            return null;
        } catch (error) {
            console.error(`❌ Error extracting PDF title: ${error}`);
            return null;
        }
    }

    /**
     * Find the largest font size in the first page content
     */
    private static findLargestFontInFirstPage(textContent: any): number {
        let largestFont = 0;

        if (textContent && textContent.items && textContent.items.length > 0) {
            for (const item of textContent.items.slice(0, 20)) { // Check first 20 items
                if (item.transform && item.transform.length > 3) {
                    // The font height can often be found in the transform matrix
                    const fontSize = Math.abs(item.transform[3]);
                    if (fontSize > largestFont) {
                        largestFont = fontSize;
                    }
                }

                if (item.height && item.height > largestFont) {
                    largestFont = item.height;
                }
            }
        }

        return largestFont;
    }

    /**
     * Extract potential titles based on font size and position
     */
    private static extractPotentialTitles(textContent: any, largestFontSize: number): string[] {
        const potentialTitles: string[] = [];
        const fontThreshold = largestFontSize * 0.8; // Accept fonts at least 80% of the largest

        if (textContent && textContent.items && textContent.items.length > 0) {
            // Group text items by line
            const lines: any[] = [];
            let currentLine: string[] = [];
            let currentY = textContent.items[0].transform[5];

            for (const item of textContent.items) {
                // Check if this item is on a new line (with small tolerance)
                const itemY = item.transform[5];
                const yDiff = Math.abs(itemY - currentY);

                if (yDiff > 2 && currentLine.length > 0) {
                    // New line detected
                    lines.push({
                        text: currentLine.join(' ').trim(),
                        fontSize: this.getItemFontSize(textContent.items[lines.length])
                    });
                    currentLine = [item.str];
                    currentY = itemY;
                } else {
                    currentLine.push(item.str);
                }
            }

            // Add the last line
            if (currentLine.length > 0) {
                lines.push({
                    text: currentLine.join(' ').trim(),
                    fontSize: this.getItemFontSize(textContent.items[lines.length])
                });
            }

            // Find lines with large font size
            for (const line of lines) {
                if (line.text && line.text.length > 3 && line.fontSize >= fontThreshold) {
                    potentialTitles.push(line.text);
                }
            }
        }

        return potentialTitles;
    }

    /**
     * Get font size from a text item
     */
    private static getItemFontSize(item: any): number {
        if (!item) return 0;

        if (item.transform && item.transform.length > 3) {
            return Math.abs(item.transform[3]);
        }

        if (item.height) {
            return item.height;
        }

        return 0;
    }

    /**
     * Extract title from Word document metadata or content - enhanced for better extraction
     */
    private static async extractTitleFromDocx(file: File): Promise<string | null> {
        try {
            console.log("📝 Processing Word document");
            const arrayBuffer = await this.readFileAsArrayBuffer(file);

            // Try core properties first
            const titleFromMetadata = await this.extractWordMetadata(arrayBuffer);
            if (titleFromMetadata) {
                console.log(`✅ Word title from metadata: "${titleFromMetadata}"`);
                return titleFromMetadata;
            }

            // Extract document content
            const result = await mammoth.extractRawText({ arrayBuffer });
            const text = result.value;

            // Look for first meaningful line as title
            const lines = text.trim().split('\n');
            for (const line of lines) {
                const cleanLine = line.trim();
                if (cleanLine && cleanLine.length > 3) {
                    // Skip lines with common non-title patterns
                    if (this.isLikelyNonTitleLine(cleanLine)) {
                        continue;
                    }

                    console.log(`✅ Word title from content: "${cleanLine}"`);
                    return cleanLine;
                }
            }

            return null;
        } catch (error) {
            console.error(`❌ Error extracting Word title: ${error}`);
            return null;
        }
    }

    /**
     * Check if a line is likely not a title
     */
    private static isLikelyNonTitleLine(line: string): boolean {
        const nonTitlePatterns = [
            /^Page \d+$/i,
            /^Table of Contents$/i,
            /^(Cover|Title) Page$/i,
            /^Abstract$/i,
            /^\d+$/  // Just a number
        ];

        return nonTitlePatterns.some(pattern => pattern.test(line));
    }

    /**
     * Extract title from HTML title tag or first heading - mirrors Python BeautifulSoup approach
     */
    private static async extractTitleFromHtml(file: File): Promise<string | null> {
        try {
            console.log("🌐 Processing HTML document");
            const text = await this.readFileAsText(file);

            // Try title tag first (same as Python version)
            const titleMatch = text.match(/<title[^>]*>([^<]+)<\/title>/i);
            if (titleMatch && titleMatch[1]) {
                const title = titleMatch[1].trim();
                console.log(`✅ HTML title from <title> tag: "${title}"`);
                return title;
            }

            // Try first heading (same as Python version)
            for (let level = 1; level <= 6; level++) {
                const headingRegex = new RegExp(`<h${level}[^>]*>([^<]+)</h${level}>`, 'i');
                const headingMatch = text.match(headingRegex);
                if (headingMatch && headingMatch[1]) {
                    const heading = headingMatch[1].trim();
                    console.log(`✅ HTML title from <h${level}> tag: "${heading}"`);
                    return heading;
                }
            }

            return null;
        } catch (error) {
            console.error(`❌ Error extracting HTML title: ${error}`);
            return null;
        }
    }

    /**
     * Extract title from EPUB metadata - mirrors Python zipfile + XML approach
     */
    private static async extractTitleFromEpub(file: File): Promise<string | null> {
        try {
            console.log("📚 Processing EPUB document");
            // Note: For web environment, you'd need a library like JSZip
            // This is a simplified version showing the structure

            // For now, return null as EPUB processing in browser requires additional libraries
            console.warn("⚠️ EPUB processing requires additional libraries in browser environment");
            return null;
        } catch (error) {
            console.error(`❌ Error extracting EPUB title: ${error}`);
            return null;
        }
    }

    /**
     * Extract title from text file (first non-empty line) - exact same as Python version
     */
    private static async extractTitleFromText(file: File): Promise<string | null> {
        try {
            console.log("📄 Processing text document");
            const text = await this.readFileAsText(file);

            const lines = text.split('\n');
            for (const line of lines) {
                const cleanLine = line.trim();
                if (cleanLine) {
                    console.log(`✅ Text title from first line: "${cleanLine}"`);
                    return cleanLine;
                }
            }

            return null;
        } catch (error) {
            console.error(`❌ Error extracting text file title: ${error}`);
            return null;
        }
    }

    // Helper methods
    private static getFileExtension(filename: string): string {
        const lastDot = filename.lastIndexOf('.');
        return lastDot !== -1 ? filename.substring(lastDot) : '';
    }

    private static async loadPDF(file: File): Promise<PDFDocumentProxy> {
        const arrayBuffer = await this.readFileAsArrayBuffer(file);
        const loadingTask = getDocument({ data: arrayBuffer });
        return await loadingTask.promise;
    }

    private static async readFileAsArrayBuffer(file: File): Promise<ArrayBuffer> {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as ArrayBuffer);
            reader.onerror = () => reject(new Error('Error reading file as ArrayBuffer'));
            reader.readAsArrayBuffer(file);
        });
    }

    private static async readFileAsText(file: File): Promise<string> {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = () => reject(new Error('Error reading file as text'));
            reader.readAsText(file, 'utf-8');
        });
    }

    /**
     * Extract Word metadata - simplified version of Python core_properties
     */
    private static async extractWordMetadata(arrayBuffer: ArrayBuffer): Promise<string | null> {
        try {
            const data = new Uint8Array(arrayBuffer);
            const decoder = new TextDecoder('utf-8', { ignoreBOM: true, fatal: false });
            const dataAsString = decoder.decode(data);

            // Look for title in core properties (same patterns as Python version)
            const titlePatterns = [
                /<dc:title>([^<]+)<\/dc:title>/i,
                /<cp:coreProperties[^>]*>[^<]*<dc:title>([^<]+)<\/dc:title>/i,
                /<title>([^<]+)<\/title>/i
            ];

            for (const pattern of titlePatterns) {
                const match = dataAsString.match(pattern);
                if (match && match[1]) {
                    const title = match[1].trim();
                    if (title && title.length > 0) {
                        return title;
                    }
                }
            }

            return null;
        } catch (error) {
            console.error("Error extracting Word metadata:", error);
            return null;
        }
    }
}
