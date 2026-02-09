/**
 * scripts/embed-reports.ts
 * Fetches PDFs, extracts text, chunks, and creates embeddings
 * Run: npx tsx scripts/embed-reports.ts
 */

import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';
import * as fs from 'fs';
import * as path from 'path';

import { PDFParse } from 'pdf-parse';

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
}

if (!OPENAI_API_KEY) {
    console.error('Missing OPENAI_API_KEY');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
const openai = new OpenAI({ apiKey: OPENAI_API_KEY });

const REPORTS = [
    {
        title: 'IPCC AR6 Synthesis Report SPM',
        org: 'IPCC',
        url: 'https://www.ipcc.ch/report/ar6/syr/downloads/report/IPCC_AR6_SYR_SPM.pdf',
        localPath: './data/IPCC_AR6_SYR_SPM.pdf',
    },
];

const CHUNK_SIZE = 500; // tokens (approximate)
const CHUNK_OVERLAP = 100;
const CHARS_PER_TOKEN = 4; // rough estimate

function chunkText(text: string): string[] {
    const chunks: string[] = [];
    const sentences = text.split(/(?<=[.!?])\s+/);
    let currentChunk = '';
    let currentTokens = 0;

    for (const sentence of sentences) {
        const sentenceTokens = Math.ceil(sentence.length / CHARS_PER_TOKEN);

        if (currentTokens + sentenceTokens > CHUNK_SIZE && currentChunk) {
            chunks.push(currentChunk.trim());

            // Overlap: keep last portion
            const words = currentChunk.split(' ');
            const overlapWords = Math.ceil((CHUNK_OVERLAP * CHARS_PER_TOKEN) / 5);
            currentChunk = words.slice(-overlapWords).join(' ') + ' ';
            currentTokens = Math.ceil(currentChunk.length / CHARS_PER_TOKEN);
        }

        currentChunk += sentence + ' ';
        currentTokens += sentenceTokens;
    }

    if (currentChunk.trim()) {
        chunks.push(currentChunk.trim());
    }

    return chunks;
}

async function fetchPDF(url: string, localPath: string): Promise<Buffer> {
    // Try local file first
    const absoluteLocalPath = path.resolve(process.cwd(), localPath);
    if (fs.existsSync(absoluteLocalPath)) {
        console.log(`  Using local file: ${localPath}`);
        return fs.readFileSync(absoluteLocalPath);
    }

    // Try to fetch from URL
    console.log(`  Fetching from URL: ${url}`);
    try {
        const response = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (compatible; VisualClimate/1.0)',
            },
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        const arrayBuffer = await response.arrayBuffer();
        return Buffer.from(arrayBuffer);
    } catch (error) {
        throw new Error(`Failed to fetch PDF: ${error instanceof Error ? error.message : error}`);
    }
}

async function embedChunks(chunks: string[]): Promise<number[][]> {
    const embeddings: number[][] = [];
    const batchSize = 20;

    for (let i = 0; i < chunks.length; i += batchSize) {
        const batch = chunks.slice(i, i + batchSize);

        const response = await openai.embeddings.create({
            model: 'text-embedding-3-small',
            input: batch,
        });

        for (const item of response.data) {
            embeddings.push(item.embedding);
        }

        console.log(`    Embedded ${Math.min(i + batchSize, chunks.length)}/${chunks.length} chunks`);
    }

    return embeddings;
}

async function processReport(report: typeof REPORTS[0]): Promise<number> {
    console.log(`\nProcessing: ${report.title}`);

    // Upsert report
    // Check if report already exists
    const { data: existing } = await supabase
        .from('reports')
        .select('id')
        .eq('title', report.title)
        .single();

    let reportData: { id: number };

    if (existing) {
        reportData = existing;
    } else {
        const { data: inserted, error: insertErr } = await supabase
            .from('reports')
            .insert({
                title: report.title,
                org: report.org,
                url: report.url,
                published_date: new Date().toISOString().split('T')[0],
            })
            .select('id')
            .single();

        if (insertErr || !inserted) {
            console.error(`  Error inserting report:`, insertErr?.message);
            return 0;
        }
        reportData = inserted;
    }

    const reportId = reportData.id;

    // Fetch and parse PDF
    let pdfBuffer: Buffer;
    try {
        pdfBuffer = await fetchPDF(report.url, report.localPath);
    } catch (error) {
        console.error(`  ${error instanceof Error ? error.message : error}`);
        console.log(`  Skipping this report.`);
        return 0;
    }

    let text: string;
    try {
        const parser = new PDFParse(new Uint8Array(pdfBuffer));
        const pdfData = await parser.getText() as { pages: { text: string; num: number }[] };
        text = pdfData.pages.map(p => p.text).join('\n\n');
        console.log(`  Extracted ${text.length} characters`);
    } catch (error) {
        console.error(`  Error parsing PDF:`, error instanceof Error ? error.message : error);
        return 0;
    }

    // Chunk text
    const chunks = chunkText(text);
    console.log(`  Created ${chunks.length} chunks`);

    // Generate embeddings
    console.log(`  Generating embeddings...`);
    const embeddings = await embedChunks(chunks);

    // Delete existing chunks for this report
    await supabase
        .from('report_chunks')
        .delete()
        .eq('report_id', reportId);

    // Insert chunks
    const chunkRows = chunks.map((content, idx) => ({
        report_id: reportId,
        chunk_index: idx,
        content,
        embedding: embeddings[idx],
    }));

    const batchSize = 50;
    let inserted = 0;

    for (let i = 0; i < chunkRows.length; i += batchSize) {
        const batch = chunkRows.slice(i, i + batchSize);

        const { error } = await supabase
            .from('report_chunks')
            .insert(batch);

        if (error) {
            console.error(`  Error inserting chunks:`, error.message);
        } else {
            inserted += batch.length;
        }
    }

    console.log(`  ✓ Inserted ${inserted} chunks`);
    return inserted;
}

async function main() {
    try {
        console.log('Starting report embedding...');
        let totalChunks = 0;

        for (const report of REPORTS) {
            const count = await processReport(report);
            totalChunks += count;
        }

        console.log(`\n✅ Complete! Total chunks created: ${totalChunks}`);
    } catch (error) {
        console.error('Error:', error instanceof Error ? error.message : error);
        process.exit(1);
    }
}

main();
