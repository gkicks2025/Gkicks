"use client"

import { useState, useEffect } from "react"
import { useChat } from "ai/react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { MessageCircle, X, RotateCcw, Minimize2, Maximize2, Send, Bot, User, ExternalLink } from "lucide-react"
import { ScrollArea } from "@/components/ui/scroll-area"

export function AIChatbot() {
  const [isOpen, setIsOpen] = useState(false)
  const [isMinimized, setIsMinimized] = useState(false)
  const [showElfsightWidget, setShowElfsightWidget] = useState(false)

  const { messages, input, handleInputChange, handleSubmit, isLoading, reload } = useChat({
    api: "/api/chatbot",
  })

  // Load Elfsight platform script
  useEffect(() => {
    const script = document.createElement('script')
    script.src = 'https://elfsightcdn.com/platform.js'
    script.async = true
    document.head.appendChild(script)

    return () => {
      // Cleanup script on unmount
      if (document.head.contains(script)) {
        document.head.removeChild(script)
      }
    }
  }, [])

  const resetConversation = () => {
    reload()
  }

  if (!isOpen) {
    return (
      <Button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 h-14 w-14 rounded-full bg-yellow-400 hover:bg-yellow-500 text-black shadow-lg z-50 transition-all duration-200 hover:scale-110"
        size="icon"
      >
        <MessageCircle className="h-6 w-6" />
      </Button>
    )
  }

  return (
    <Card className="fixed bottom-6 right-6 w-96 shadow-2xl z-50 bg-card border-2 border-yellow-400 dark:border-yellow-500">
      <CardHeader className="pb-3 bg-gradient-to-r from-yellow-400 to-yellow-500 text-black rounded-t-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Bot className="h-5 w-5" />
            <div>
              <CardTitle className="text-lg font-bold">GKicks Assistant</CardTitle>
              <div className="flex items-center space-x-1 mt-1">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-xs font-medium">Online</span>
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowElfsightWidget(!showElfsightWidget)}
              className="h-8 px-2 text-xs text-black hover:bg-black/10 flex items-center space-x-1"
              title={showElfsightWidget ? "Switch to Custom Chat" : "Switch to Elfsight Widget"}
            >
              <ExternalLink className="h-3 w-3" />
              <span>{showElfsightWidget ? "Custom" : "Elfsight"}</span>
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsMinimized(!isMinimized)}
              className="h-8 w-8 text-black hover:bg-black/10"
              title={isMinimized ? "Maximize" : "Minimize"}
            >
              {isMinimized ? <Maximize2 className="h-4 w-4" /> : <Minimize2 className="h-4 w-4" />}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={resetConversation}
              className="h-8 w-8 text-black hover:bg-black/10"
              title="Reset conversation"
            >
              <RotateCcw className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsOpen(false)}
              className="h-8 w-8 text-black hover:bg-black/10"
              title="Close chat"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>

      {!isMinimized && (
        <CardContent className="p-0">
          <div className="h-96 flex flex-col">
            {showElfsightWidget ? (
              <div className="h-full p-4">
                <div className="elfsight-app-1645323a-e0ed-4f5c-a082-273ee0550c9c" data-elfsight-app-lazy></div>
              </div>
            ) : (
              <ScrollArea className="flex-1 p-4">
                {messages.length === 0 ? (
                  <div className="text-center py-8">
                    <Bot className="h-12 w-12 mx-auto mb-4 text-yellow-500" />
                    <h3 className="font-semibold text-gray-900 dark:text-yellow-400 mb-2">Welcome to GKicks!</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                      I'm here to help you find the perfect shoes. Ask me about:
                    </p>
                    <div className="flex flex-wrap gap-2 justify-center">
                      <Badge variant="secondary" className="text-xs">
                        Products
                      </Badge>
                      <Badge variant="secondary" className="text-xs">
                        Sizing
                      </Badge>
                      <Badge variant="secondary" className="text-xs">
                        Prices
                      </Badge>
                      <Badge variant="secondary" className="text-xs">
                        Shipping
                      </Badge>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {messages.map((message) => (
                      <div
                        key={message.id}
                        className={`flex items-start space-x-2 ${
                          message.role === "user" ? "justify-end" : "justify-start"
                        }`}
                      >
                        {message.role === "assistant" && (
                          <div className="w-8 h-8 rounded-full bg-yellow-400 flex items-center justify-center flex-shrink-0">
                            <Bot className="h-4 w-4 text-black" />
                          </div>
                        )}
                        <div
                          className={`max-w-[80%] p-3 rounded-lg ${
                            message.role === "user"
                              ? "bg-yellow-400 text-black ml-auto"
                              : "bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-yellow-400"
                          }`}
                        >
                          <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                        </div>
                        {message.role === "user" && (
                          <div className="w-8 h-8 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center flex-shrink-0">
                            <User className="h-4 w-4 text-gray-600 dark:text-gray-300" />
                          </div>
                        )}
                      </div>
                    ))}
                    {isLoading && (
                      <div className="flex items-start space-x-2">
                        <div className="w-8 h-8 rounded-full bg-yellow-400 flex items-center justify-center flex-shrink-0">
                          <Bot className="h-4 w-4 text-black" />
                        </div>
                        <div className="bg-gray-100 dark:bg-gray-700 p-3 rounded-lg">
                          <div className="flex space-x-1">
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                            <div
                              className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                              style={{ animationDelay: "0.1s" }}
                            ></div>
                            <div
                              className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                              style={{ animationDelay: "0.2s" }}
                            ></div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </ScrollArea>
            )}

            {!showElfsightWidget && (
              <div className="p-4 border-t border-border">
                <form onSubmit={handleSubmit} className="flex space-x-2">
                  <Input
                    value={input}
                    onChange={handleInputChange}
                    placeholder="Ask about shoes, sizing, prices..."
                    className="flex-1 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-yellow-400"
                    disabled={isLoading}
                  />
                  <Button
                    type="submit"
                    size="icon"
                    disabled={isLoading || !input.trim()}
                    className="bg-yellow-400 hover:bg-yellow-500 text-black"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </form>
              </div>
            )}
          </div>
        </CardContent>
      )}
    </Card>
  )
}
