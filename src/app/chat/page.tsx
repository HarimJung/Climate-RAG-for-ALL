import ChatPanel from '@/components/rag/ChatPanel';

interface ChatPageProps {
  searchParams: Promise<{ country?: string }>;
}

export default async function ChatPage({ searchParams }: ChatPageProps) {
  const params = await searchParams;
  const countryIso3 = params.country;

  return (
    <main className="h-screen flex flex-col">
      <header className="border-b border-gray-200 px-6 py-4">
        <h1 className="text-xl font-semibold text-gray-900">
          VisualClimate AI
          {countryIso3 && (
            <span className="ml-2 text-sm font-normal text-gray-500">
              ({countryIso3.toUpperCase()})
            </span>
          )}
        </h1>
      </header>
      <div className="flex-1 overflow-hidden">
        <ChatPanel countryIso3={countryIso3} />
      </div>
    </main>
  );
}
