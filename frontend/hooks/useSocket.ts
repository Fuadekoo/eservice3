"use client";

import { useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";
import { useAuthStore } from "@/lib/stores/auth-store";

const getSocketConfig = () => {
  // Get the server URL from environment variable
  const serverUrl = process.env.NEXT_PUBLIC_SERVER_URL;

  if (!serverUrl) {
    // Fallback to localhost if env var is not set
    // Use port 5000 to match backend default port
    console.warn(
      "NEXT_PUBLIC_SERVER_URL not set, using default localhost:5000",
    );
    return { url: "http://localhost:5000" };
  }

  try {
    // Parse the URL to get the base URL (without /back-api path)
    const urlObj = new URL(serverUrl);
    // Return base URL (protocol + host + port)
    const baseUrl = `${urlObj.protocol}//${urlObj.host}`;
    return { url: baseUrl };
  } catch (error) {
    // If URL parsing fails, try to remove /back-api from the end
    console.warn(
      "Failed to parse NEXT_PUBLIC_SERVER_URL, attempting fallback:",
      error,
    );
    const url = serverUrl.split("/").slice(0, -1).join("/");
    return { url: url || "http://localhost:5000" };
  }
};

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  message: string;
  timestamp: string;
  schoolId?: string;
  recipientId?: string;
}

export function useSocket() {
  const { token, isAuthenticated } = useAuthStore();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    // Get token from store
    const authToken = token;

    // Only connect if authenticated and have a token
    if (!isAuthenticated && !authToken) {
      return;
    }

    if (!authToken) {
      return;
    }

    // Clean up existing connection
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }

    // Create new socket connection
    const socketConfig = getSocketConfig();
    const newSocket = io(socketConfig.url, {
      // const newSocket = io("https://back-api.suffah.education", {
      auth: { token: authToken },
      transports: ["websocket", "polling"],
      // path: socketConfig.path,
    });

    socketRef.current = newSocket;
    setSocket(newSocket);

    // Connection event handlers
    newSocket.on("connect", () => {
      console.log("Socket connected:", newSocket.id);
      setIsConnected(true);
    });

    newSocket.on("disconnect", () => {
      console.log("Socket disconnected");
      setIsConnected(false);
    });

    newSocket.on(
      "connect_error",
      (
        error: Error & { type?: string; description?: string; context?: any },
      ) => {
        console.error("Socket connection error:", error);
        console.error("Socket error details:", {
          message: error.message,
          type: error.type,
          description: error.description,
          context: error.context,
          url: socketConfig.url,
        });
        setIsConnected(false);
      },
    );

    // Message event handlers
    newSocket.on("previous_messages", (messages: ChatMessage[]) => {
      setMessages(messages);
    });

    newSocket.on("new_message", (message: ChatMessage) => {
      setMessages((prev) => {
        // Prevent duplicate messages
        const exists = prev.some((m) => m.id === message.id);
        if (!exists) {
          return [...prev, message];
        }
        return prev;
      });
    });

    // Typing indicator handlers
    newSocket.on(
      "user_typing",
      (data: { userId: string; isTyping: boolean }) => {
        setTypingUsers((prev) => {
          const newSet = new Set(prev);
          if (data.isTyping) {
            newSet.add(data.userId);
          } else {
            newSet.delete(data.userId);
          }
          return newSet;
        });
      },
    );

    // Error handler
    newSocket.on("error", (error: { message: string }) => {
      console.error("Socket error:", error);
    });

    // Online/offline user handlers
    newSocket.on("online_users", (data: { userIds: string[] }) => {
      setOnlineUsers(new Set(data.userIds));
    });

    newSocket.on("user_online", (data: { userId: string }) => {
      setOnlineUsers((prev) => {
        const newSet = new Set(prev);
        newSet.add(data.userId);
        return newSet;
      });
    });

    newSocket.on("user_offline", (data: { userId: string }) => {
      setOnlineUsers((prev) => {
        const newSet = new Set(prev);
        newSet.delete(data.userId);
        return newSet;
      });
    });

    // Cleanup on unmount
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      setIsConnected(false);
      setSocket(null);
    };
  }, [isAuthenticated, token]);

  const sendMessage = (message: string, recipientId?: string) => {
    if (socket && isConnected && message.trim()) {
      socket.emit("send_message", {
        message: message.trim(),
        recipientId: recipientId || undefined,
      });
    }
  };

  const sendTyping = (isTyping: boolean) => {
    if (socket && isConnected) {
      socket.emit("typing", { isTyping });
    }
  };

  const loadPrivateMessages = (recipientId: string) => {
    if (socket && isConnected) {
      socket.emit("load_private_messages", { recipientId });
    }
  };

  const loadGroupMessages = () => {
    // Load group messages by emitting with no recipientId
    if (socket && isConnected) {
      socket.emit("load_private_messages", { recipientId: undefined });
    }
  };

  return {
    socket,
    isConnected,
    messages,
    typingUsers,
    onlineUsers,
    sendMessage,
    sendTyping,
    loadPrivateMessages,
    loadGroupMessages,
  };
}
