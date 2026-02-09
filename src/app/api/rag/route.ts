import { NextRequest, NextResponse } from 'next/server';
import { getOpenAI } from '@/lib/openai';
import { createServiceClient } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
  try {
    const { message, countryIso3 } = await req.json();

    if (!message || typeof message !== 'string') {
      return NextResponse.json({ error: 'message is required' }, { status: 400 });
    }

    const supabase = createServiceClient();

    // 1. Embed the query
    const embeddingRes = await getOpenAI().embeddings.create({
      model: 'text-embedding-3-small',
      input: message,
    });
    const queryEmbedding = embeddingRes.data[0].embedding;

    // 2. Vector search via RPC
    const { data: chunks, error: chunksError } = await supabase.rpc('match_report_chunks', {
      query_embedding: queryEmbedding,
      match_threshold: 0.3,
      match_count: 8,
    });

    if (chunksError) {
      throw new Error(`Vector search failed: ${chunksError.message}`);
    }

    // 3. Build context from matched chunks
    let context = '';
    const sourceMap = new Map<number, { title: string; org: string; similarity: number }>();

    if (chunks && chunks.length > 0) {
      const reportIds = [...new Set(chunks.map((c: { report_id: number }) => c.report_id))];
      const { data: reports } = await supabase
        .from('reports')
        .select('id, title, org')
        .in('id', reportIds);

      const reportLookup = new Map(
        (reports ?? []).map((r: { id: number; title: string; org: string }) => [r.id, r])
      );

      for (const chunk of chunks) {
        const report = reportLookup.get(chunk.report_id);
        if (report) {
          context += `[Source: ${report.title} by ${report.org}]\n${chunk.content}\n\n`;
          if (!sourceMap.has(chunk.report_id)) {
            sourceMap.set(chunk.report_id, {
              title: report.title,
              org: report.org,
              similarity: chunk.similarity,
            });
          }
        }
      }
    }

    // 4. If countryIso3 provided, fetch indicator data
    let countryContext = '';
    if (countryIso3) {
      const { data: country } = await supabase
        .from('countries')
        .select('id, name')
        .eq('iso3', countryIso3.toUpperCase())
        .single();

      if (country) {
        const { data: values } = await supabase
          .from('indicator_values')
          .select('year, value, indicators(name, unit)')
          .eq('country_id', country.id)
          .order('year', { ascending: false })
          .limit(50);

        if (values && values.length > 0) {
          countryContext = `\n[Country Data: ${country.name}]\n`;
          for (const v of values) {
            const ind = v.indicators as unknown as { name: string; unit: string } | null;
            if (ind) {
              countryContext += `${ind.name}: ${v.value} ${ind.unit} (${v.year})\n`;
            }
          }
          countryContext += '\n';
        }
      }
    }

    const fullContext = context + countryContext;

    // 5. Generate answer with GPT-4o-mini
    const completion = await getOpenAI().chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content:
            'You are VisualClimate AI, a climate data assistant. Answer based ONLY on provided context. Always cite sources [Source: Report Title]. Never fabricate data.',
        },
        {
          role: 'user',
          content: fullContext
            ? `Context:\n${fullContext}\n\nQuestion: ${message}`
            : `No relevant documents found. Question: ${message}`,
        },
      ],
      temperature: 0.3,
      max_tokens: 1024,
    });

    const answer = completion.choices[0]?.message?.content ?? 'No answer generated.';
    const sources = Array.from(sourceMap.values()).map((s) => ({
      title: s.title,
      org: s.org,
      similarity: Math.round(s.similarity * 100) / 100,
    }));

    return NextResponse.json({ answer, sources });
  } catch (error) {
    console.error('RAG API error:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
