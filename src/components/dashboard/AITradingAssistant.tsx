
import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Brain, Send, TrendingUp, AlertTriangle, Lightbulb, Target } from 'lucide-react';

interface ChatMessage {
  id: string;
  type: 'user' | 'ai';
  content: string;
  timestamp: Date;
  suggestions?: string[];
  confidence?: number;
}

const AITradingAssistant = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      type: 'ai',
      content: "Hello! I'm your AI trading assistant. I can help you with market analysis, portfolio optimization, and investment strategies. What would you like to know?",
      timestamp: new Date(),
      suggestions: [
        "Analyze my portfolio risk",
        "What's the market sentiment today?",
        "Show me top stock picks",
        "Create a retirement plan"
      ]
    }
  ]);

  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  const predefinedResponses = {
    "portfolio": {
      content: "Based on your current portfolio analysis, you have a well-diversified mix with 60% stocks, 25% crypto, 10% ETFs, and 5% cash. Your risk score is 6.5/10, which aligns with moderate-aggressive investing. I recommend rebalancing your tech allocation as it's currently overweight at 35%.",
      confidence: 87,
      suggestions: ["Show rebalancing options", "Analyze sector exposure", "Risk mitigation strategies"]
    },
    "market": {
      content: "Current market sentiment is cautiously optimistic. The Fear & Greed Index is at 68 (Greed territory). Key factors: Fed policy uncertainty, strong earnings growth, and geopolitical tensions. Tech sector showing resilience, while financials are underperforming.",
      confidence: 92,
      suggestions: ["Tech sector analysis", "Interest rate impact", "Defensive strategies"]
    },
    "stocks": {
      content: "Top AI-recommended stocks for your risk profile: 1) NVDA - Strong AI momentum, 89% confidence 2) MSFT - Cloud growth, 85% confidence 3) GOOGL - Ad recovery, 78% confidence. All show positive technical indicators and fundamental strength.",
      confidence: 85,
      suggestions: ["Buy NVDA", "Set price alerts", "Compare alternatives"]
    }
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: inputMessage,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsTyping(true);

    // Simulate AI response
    setTimeout(() => {
      const keyword = inputMessage.toLowerCase();
      let response = predefinedResponses.portfolio; // default

      if (keyword.includes('market') || keyword.includes('sentiment')) {
        response = predefinedResponses.market;
      } else if (keyword.includes('stock') || keyword.includes('pick')) {
        response = predefinedResponses.stocks;
      }

      const aiMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'ai',
        content: response.content,
        timestamp: new Date(),
        suggestions: response.suggestions,
        confidence: response.confidence
      };

      setMessages(prev => [...prev, aiMessage]);
      setIsTyping(false);
    }, 1500);
  };

  const handleSuggestionClick = (suggestion: string) => {
    setInputMessage(suggestion);
  };

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages]);

  return (
    <Card className="h-[600px] flex flex-col">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center">
          <Brain className="w-5 h-5 mr-2 text-purple-600" />
          AI Trading Assistant
        </CardTitle>
        <CardDescription>
          Get personalized investment insights powered by advanced AI
        </CardDescription>
      </CardHeader>
      
      <CardContent className="flex-1 flex flex-col p-0">
        <ScrollArea className="flex-1 px-4" ref={scrollAreaRef}>
          <div className="space-y-4 pb-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-lg p-3 ${
                    message.type === 'user'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-900'
                  }`}
                >
                  <div className="text-sm">{message.content}</div>
                  
                  {message.confidence && (
                    <div className="mt-2 flex items-center">
                      <Badge variant="secondary" className="text-xs">
                        {message.confidence}% confidence
                      </Badge>
                    </div>
                  )}
                  
                  {message.suggestions && (
                    <div className="mt-3 space-y-2">
                      <div className="text-xs text-gray-600">Quick actions:</div>
                      <div className="flex flex-wrap gap-2">
                        {message.suggestions.map((suggestion, index) => (
                          <Button
                            key={index}
                            variant="outline"
                            size="sm"
                            className="text-xs h-6"
                            onClick={() => handleSuggestionClick(suggestion)}
                          >
                            {suggestion}
                          </Button>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  <div className="text-xs opacity-60 mt-2">
                    {message.timestamp.toLocaleTimeString()}
                  </div>
                </div>
              </div>
            ))}
            
            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-gray-100 rounded-lg p-3 max-w-[80%]">
                  <div className="flex items-center space-x-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
        
        <div className="p-4 border-t">
          <div className="flex space-x-2">
            <Input
              placeholder="Ask about markets, portfolio, or get investment advice..."
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              className="flex-1"
            />
            <Button 
              onClick={handleSendMessage}
              size="icon"
              disabled={!inputMessage.trim() || isTyping}
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
          
          <div className="flex items-center mt-2 text-xs text-gray-500">
            <AlertTriangle className="w-3 h-3 mr-1" />
            AI suggestions are not financial advice. Always do your own research.
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default AITradingAssistant;
