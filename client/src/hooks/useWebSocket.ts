import { useEffect, useRef, useState } from "react";
import type { WebSocketMessage } from "../types";

export function useWebSocket(projectId?: number) {
  const [isConnected, setIsConnected] = useState(false);
  const [messages, setMessages] = useState<WebSocketMessage[]>([]);
  const wsRef = useRef<WebSocket | null>(null);

  const connect = () => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      return;
    }

    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    
    wsRef.current = new WebSocket(wsUrl);

    wsRef.current.onopen = () => {
      setIsConnected(true);
      if (projectId) {
        wsRef.current?.send(JSON.stringify({
          type: 'join_project',
          projectId
        }));
      }
    };

    wsRef.current.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        setMessages(prev => [...prev, message]);
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };

    wsRef.current.onclose = () => {
      setIsConnected(false);
      // Attempt to reconnect after a delay
      setTimeout(connect, 3000);
    };

    wsRef.current.onerror = (error) => {
      console.error('WebSocket error:', error);
      setIsConnected(false);
    };
  };

  const disconnect = () => {
    wsRef.current?.close();
    wsRef.current = null;
  };

  const sendMessage = (message: WebSocketMessage) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));
    }
  };

  useEffect(() => {
    connect();
    return disconnect;
  }, [projectId]);

  // Clear messages when projectId changes
  useEffect(() => {
    setMessages([]);
  }, [projectId]);

  return {
    isConnected,
    messages,
    sendMessage,
    connect,
    disconnect
  };
}
