import { useEffect, useState } from 'react'
import { pusherClient } from '@/lib/pusher'

interface AIFeedbackData {
  submissionId: string;
  userId: string;
  userName: string;
  milestoneTitle: string;
  aiComment: string;
  aiVerified: boolean;
  score: number;
  timestamp: string;
}

export function useAIFeedback(groupId: string) {
  const [isConnected, setIsConnected] = useState(false)
  const [recentFeedback, setRecentFeedback] = useState<AIFeedbackData[]>([])

  useEffect(() => {
    const channel = pusherClient.subscribe(`group-${groupId}`)

    channel.bind('ai-feedback-completed', (data: AIFeedbackData) => {
      console.log('AI feedback received:', data)
      setRecentFeedback(prev => [data, ...prev.slice(0, 4)]) // Keep last 5 feedback items
      
      // Show browser notification if available
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('AI Feedback Ready!', {
          body: `${data.userName}'s submission for "${data.milestoneTitle}" has been reviewed.`,
          icon: '/logo.png',
          tag: `ai-feedback-${data.submissionId}`,
        })
      }
    })

    pusherClient.connection.bind('connected', () => {
      setIsConnected(true)
    })

    pusherClient.connection.bind('disconnected', () => {
      setIsConnected(false)
    })

    return () => {
      channel.unbind_all()
      pusherClient.unsubscribe(`group-${groupId}`)
    }
  }, [groupId])

  return { recentFeedback, isConnected }
}
