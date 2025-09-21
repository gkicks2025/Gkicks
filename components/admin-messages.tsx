"use client"

import { useState, useEffect, useRef } from "react"
import { MessageCircle, Send, User, Search, Filter, MoreVertical, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Separator } from "@/components/ui/separator"

interface Message {
  id: string
  content: string
  sender: "admin" | "seller" | "customer"
  timestamp: Date
  read: boolean
  sender_type?: string
  message_content?: string
  created_at?: string
  is_read?: boolean
}

interface Conversation {
  id: string
  participantName: string
  participantType: "seller" | "customer"
  participantEmail: string
  lastMessage: string
  lastMessageTime: Date
  unreadCount: number
  messages: Message[]
  user_name?: string
  user_email?: string
  subject?: string
  status?: string
  last_message?: string
  unread_count?: number
  last_message_at?: string
}

export function AdminMessages() {
  const [isOpen, setIsOpen] = useState(false)
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null)
  const [newMessage, setNewMessage] = useState("")
  const [searchQuery, setSearchQuery] = useState("")
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Scroll to bottom when messages change
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [selectedConversation?.messages])

  // Fetch real conversations from API
  useEffect(() => {
    const fetchConversations = async () => {
      try {
        const response = await fetch('/api/support/conversations')
        if (response.ok) {
          const data = await response.json()
          const formattedConversations: Conversation[] = data.conversations.map((conv: any) => ({
            id: conv.id.toString(),
            participantName: conv.user_name || 'Unknown User',
            participantType: "customer" as const,
            participantEmail: conv.user_email,
            lastMessage: conv.last_message || 'No messages',
            lastMessageTime: new Date(conv.last_message_at || conv.created_at),
            unreadCount: conv.unread_count || 0,
            messages: [], // Will be loaded when conversation is selected
            user_name: conv.user_name,
            user_email: conv.user_email,
            subject: conv.subject,
            status: conv.status,
            last_message: conv.last_message,
            unread_count: conv.unread_count,
            last_message_at: conv.last_message_at
          }))
          setConversations(formattedConversations)
        }
      } catch (error) {
        console.error('Error fetching conversations:', error)
        // Fallback to mock data if API fails
        const mockConversations: Conversation[] = [
          {
            id: "1",
            participantName: "John Doe",
            participantType: "customer",
            participantEmail: "john@example.com",
            lastMessage: "Hi, I have a question about my order #12345",
            lastMessageTime: new Date(Date.now() - 1000 * 60 * 30),
            unreadCount: 2,
            messages: []
          },
          {
            id: "2",
            participantName: "Jane Smith",
            participantType: "customer",
            participantEmail: "jane@example.com",
            lastMessage: "When will my shoes be delivered?",
            lastMessageTime: new Date(Date.now() - 1000 * 60 * 60 * 2),
            unreadCount: 1,
            messages: []
          },
          {
            id: "3",
            participantName: "Mike Johnson",
            participantType: "seller",
            participantEmail: "mike@seller.com",
            lastMessage: "I need help with product listing",
            lastMessageTime: new Date(Date.now() - 1000 * 60 * 60 * 24),
            unreadCount: 0,
            messages: []
          }
        ]
        setConversations(mockConversations)
      }
    }

    fetchConversations()
  }, [])

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation) return

    try {
      const response = await fetch('/api/support/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          conversation_id: selectedConversation.id,
          message_content: newMessage,
          sender_type: 'admin'
        })
      })

      if (response.ok) {
        const message: Message = {
          id: Date.now().toString(),
          content: newMessage,
          sender: "admin",
          timestamp: new Date(),
          read: true
        }

        setConversations(prev => 
          prev.map(conv => 
            conv.id === selectedConversation.id 
              ? {
                  ...conv,
                  messages: [...conv.messages, message],
                  lastMessage: newMessage,
                  lastMessageTime: new Date()
                }
              : conv
          )
        )

        setSelectedConversation(prev => 
          prev ? {
            ...prev,
            messages: [...prev.messages, message],
            lastMessage: newMessage,
            lastMessageTime: new Date()
          } : null
        )

        setNewMessage("")
      } else {
        console.error('Failed to send message')
      }
    } catch (error) {
      console.error('Error sending message:', error)
    }
  }

  const loadConversationMessages = async (conversationId: string) => {
    try {
      const response = await fetch(`/api/support/messages?conversation_id=${conversationId}`)
      if (response.ok) {
        const data = await response.json()
        const formattedMessages: Message[] = data.messages.map((msg: any) => ({
          id: msg.id.toString(),
          content: msg.message_content,
          sender: msg.sender_type as "admin" | "customer",
          timestamp: new Date(msg.created_at),
          read: msg.is_read
        }))
        
        setConversations(prev => 
          prev.map(conv => 
            conv.id === conversationId 
              ? { ...conv, messages: formattedMessages }
              : conv
          )
        )
        
        const conversation = conversations.find(c => c.id === conversationId)
        if (conversation) {
          setSelectedConversation({
            ...conversation,
            messages: formattedMessages
          })
        }
      }
    } catch (error) {
      console.error('Error loading messages:', error)
    }
  }

  const filteredConversations = conversations.filter(conv =>
    conv.participantName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    conv.participantEmail.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const totalUnreadCount = conversations.reduce((sum, conv) => sum + conv.unreadCount, 0)

  const formatTime = (date: Date) => {
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const minutes = Math.floor(diff / (1000 * 60))
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))

    if (minutes < 60) return `${minutes}m ago`
    if (hours < 24) return `${hours}h ago`
    return `${days}d ago`
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative hover:bg-accent"
          title="Messages"
        >
          <MessageCircle className="h-5 w-5" />
          {totalUnreadCount > 0 && (
            <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs bg-red-500 hover:bg-red-600">
              {totalUnreadCount > 99 ? '99+' : totalUnreadCount}
            </Badge>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-[95vw] w-[95vw] h-[85vh] p-0 gap-0">
        <div className="flex h-full">
          {/* Conversations List */}
          <div className="w-96 min-w-96 border-r border-border flex flex-col bg-muted/30">
            <DialogHeader className="p-4 border-b border-border bg-background">
              <DialogTitle className="flex items-center justify-between">
                <div className="flex items-center">
                  <MessageCircle className="h-5 w-5 mr-2" />
                  Messages
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsOpen(false)}
                  className="h-6 w-6"
                >
                  <X className="h-4 w-4" />
                </Button>
              </DialogTitle>
            </DialogHeader>
            
            <div className="p-3 border-b border-border bg-background">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search conversations..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 h-9"
                />
              </div>
            </div>

            <ScrollArea className="flex-1">
              <div className="p-2">
                {filteredConversations.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <MessageCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No conversations found</p>
                  </div>
                ) : (
                  filteredConversations.map((conversation) => (
                    <div
                      key={conversation.id}
                      className={`p-3 rounded-lg cursor-pointer transition-all duration-200 mb-1 ${
                        selectedConversation?.id === conversation.id
                          ? "bg-primary/15 border border-primary/20"
                          : "hover:bg-accent/50"
                      }`}
                      onClick={() => {
                        setSelectedConversation(conversation)
                        loadConversationMessages(conversation.id)
                      }}
                    >
                      <div className="flex items-start space-x-3">
                        <Avatar className="h-10 w-10 flex-shrink-0">
                          <AvatarFallback className={`text-xs font-medium ${
                            conversation.participantType === "seller" 
                              ? "bg-green-100 text-green-700" 
                              : "bg-blue-100 text-blue-700"
                          }`}>
                            {conversation.participantName.split(' ').map(n => n[0]).join('').toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <p className="text-sm font-medium truncate">
                              {conversation.participantName}
                            </p>
                            <div className="flex items-center space-x-1">
                              <Badge 
                                variant="secondary" 
                                className={`text-xs px-2 py-0.5 ${
                                  conversation.participantType === "seller" 
                                    ? "bg-green-100 text-green-700" 
                                    : "bg-blue-100 text-blue-700"
                                }`}
                              >
                                {conversation.participantType}
                              </Badge>
                              {conversation.unreadCount > 0 && (
                                <Badge className="h-5 w-5 flex items-center justify-center p-0 text-xs bg-red-500">
                                  {conversation.unreadCount > 9 ? '9+' : conversation.unreadCount}
                                </Badge>
                              )}
                            </div>
                          </div>
                          <p className="text-xs text-muted-foreground truncate mb-1">
                            {conversation.lastMessage}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {formatTime(conversation.lastMessageTime)}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </div>

          {/* Chat Area */}
          <div className="flex-1 flex flex-col min-w-0">
            {selectedConversation ? (
              <>
                {/* Chat Header */}
                <div className="p-4 border-b border-border bg-background">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Avatar className="h-9 w-9">
                        <AvatarFallback className={`text-xs font-medium ${
                          selectedConversation.participantType === "seller" 
                            ? "bg-green-100 text-green-700" 
                            : "bg-blue-100 text-blue-700"
                        }`}>
                          {selectedConversation.participantName.split(' ').map(n => n[0]).join('').toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium text-sm">{selectedConversation.participantName}</p>
                        <p className="text-xs text-muted-foreground">{selectedConversation.participantEmail}</p>
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>Mark as read</DropdownMenuItem>
                        <DropdownMenuItem>Archive conversation</DropdownMenuItem>
                        <DropdownMenuItem className="text-red-600">Block user</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>

                {/* Messages */}
                <ScrollArea className="flex-1 p-4" style={{ maxHeight: 'calc(85vh - 200px)' }}>
                  <div className="space-y-4 pr-2">
                    {selectedConversation.messages.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <MessageCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">No messages yet</p>
                        <p className="text-xs">Start the conversation below</p>
                      </div>
                    ) : (
                      selectedConversation.messages.map((message) => (
                        <div
                          key={message.id}
                          className={`flex ${message.sender === "admin" ? "justify-end" : "justify-start"}`}
                        >
                          <div className={`flex items-start space-x-2 max-w-[80%] ${
                            message.sender === "admin" ? "flex-row-reverse space-x-reverse" : ""
                          }`}>
                            <Avatar className="h-7 w-7 flex-shrink-0">
                              <AvatarFallback className={`text-xs font-medium ${
                                message.sender === "admin" 
                                  ? "bg-primary text-primary-foreground" 
                                  : message.sender === "seller"
                                  ? "bg-green-100 text-green-700"
                                  : "bg-blue-100 text-blue-700"
                              }`}>
                                {message.sender === "admin" ? "A" : 
                                 message.sender === "seller" ? "S" : "C"}
                              </AvatarFallback>
                            </Avatar>
                            
                            <div className={`rounded-2xl px-4 py-2 break-words ${
                              message.sender === "admin"
                                ? "bg-primary text-primary-foreground"
                                : "bg-muted"
                            }`}>
                              <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
                              <p className={`text-xs mt-1 ${
                                message.sender === "admin" ? "text-primary-foreground/70" : "text-muted-foreground"
                              }`}>
                                {formatTime(message.timestamp)}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                    <div ref={messagesEndRef} />
                  </div>
                </ScrollArea>

                {/* Message Input */}
                <div className="p-4 border-t border-border bg-background">
                  <div className="flex space-x-2">
                    <Input
                      placeholder="Type your message..."
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault()
                          handleSendMessage()
                        }
                      }}
                      className="flex-1"
                    />
                    <Button 
                      onClick={handleSendMessage} 
                      disabled={!newMessage.trim()}
                      size="icon"
                      className="h-10 w-10"
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center bg-muted/20">
                <div className="text-center max-w-sm">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
                    <MessageCircle className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">Select a conversation</h3>
                  <p className="text-sm text-muted-foreground">
                    Choose a conversation from the list to start messaging with customers and sellers
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}