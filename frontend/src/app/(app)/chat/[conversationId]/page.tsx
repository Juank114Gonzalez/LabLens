import type { Metadata } from 'next';
import { ChatWindow } from '@/features/chat/components/chat-window';

export const metadata: Metadata = {
  title: 'Conversación',
};

type ChatPageProps = {
  params: Promise<{ conversationId: string }>;
};

export default async function ChatPage({ params }: ChatPageProps) {
  const { conversationId } = await params;
  return <ChatWindow conversationId={conversationId} />;
}
