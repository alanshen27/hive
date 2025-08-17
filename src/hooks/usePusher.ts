import { useEffect, useState } from 'react'
import { pusherClient } from '@/lib/pusher'

interface Message {
  id: string;
  content: string;
  isAI: boolean;
  createdAt: string;
  user: {
    id: string;
    name: string;
    avatar?: string;
  };
}

export function usePusher(groupId: string) {
  const [isConnected, setIsConnected] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([])

  useEffect(() => {
    const channel = pusherClient.subscribe(`group-${groupId}`)

    channel.bind('new-notification', (data: { notification: Notification }) => {
      setNotifications(prev => [...prev, data.notification])
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

  return { notifications, isConnected }
}

export function usePusherConnection() {
  const [isConnected, setIsConnected] = useState(false)

  useEffect(() => {
    pusherClient.connection.bind('connected', () => {
      setIsConnected(true)
    })

    pusherClient.connection.bind('disconnected', () => {
      setIsConnected(false)
    })

    return () => {
      pusherClient.connection.unbind_all()
    }
  }, [])

  return { isConnected }
}
