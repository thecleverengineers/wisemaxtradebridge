import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Newspaper, TrendingUp, TrendingDown, AlertTriangle, Calendar, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface NewsItem {
  id: string;
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  currency: string[];
  actual?: string;
  forecast?: string;
  previous?: string;
  time: Date;
  sentiment?: 'bullish' | 'bearish' | 'neutral';
}

export function NewsIntegration() {
  const [newsItems, setNewsItems] = useState<NewsItem[]>([]);
  const [filter, setFilter] = useState<'all' | 'high' | 'medium' | 'low'>('all');

  useEffect(() => {
    // Simulate real-time news updates
    const mockNews: NewsItem[] = [
      {
        id: '1',
        title: 'Fed Interest Rate Decision',
        description: 'Federal Reserve announces rate hike of 25 basis points',
        impact: 'high',
        currency: ['USD'],
        actual: '5.50%',
        forecast: '5.25%',
        previous: '5.25%',
        time: new Date(Date.now() - 3600000),
        sentiment: 'bullish'
      },
      {
        id: '2',
        title: 'ECB Policy Meeting Minutes',
        description: 'European Central Bank maintains current policy stance',
        impact: 'medium',
        currency: ['EUR'],
        time: new Date(Date.now() - 7200000),
        sentiment: 'neutral'
      },
      {
        id: '3',
        title: 'UK GDP Growth Data',
        description: 'UK economy grows 0.3% in Q4, beating expectations',
        impact: 'high',
        currency: ['GBP'],
        actual: '0.3%',
        forecast: '0.2%',
        previous: '0.1%',
        time: new Date(Date.now() - 10800000),
        sentiment: 'bullish'
      },
      {
        id: '4',
        title: 'US Non-Farm Payrolls',
        description: 'US adds 200K jobs in December, unemployment at 3.7%',
        impact: 'high',
        currency: ['USD'],
        actual: '200K',
        forecast: '180K',
        previous: '175K',
        time: new Date(Date.now() - 14400000),
        sentiment: 'bullish'
      },
      {
        id: '5',
        title: 'Bank of Japan Policy Update',
        description: 'BoJ maintains ultra-loose monetary policy',
        impact: 'medium',
        currency: ['JPY'],
        time: new Date(Date.now() - 18000000),
        sentiment: 'bearish'
      },
      {
        id: '6',
        title: 'Australian Employment Data',
        description: 'Australia unemployment rate drops to 3.5%',
        impact: 'medium',
        currency: ['AUD'],
        actual: '3.5%',
        forecast: '3.7%',
        previous: '3.8%',
        time: new Date(Date.now() - 21600000),
        sentiment: 'bullish'
      },
      {
        id: '7',
        title: 'China Manufacturing PMI',
        description: 'China PMI rises to 52.1, indicating expansion',
        impact: 'low',
        currency: ['CNY', 'AUD'],
        actual: '52.1',
        forecast: '51.5',
        previous: '51.0',
        time: new Date(Date.now() - 25200000),
        sentiment: 'bullish'
      },
      {
        id: '8',
        title: 'Eurozone Inflation Data',
        description: 'Eurozone CPI falls to 2.4% YoY',
        impact: 'high',
        currency: ['EUR'],
        actual: '2.4%',
        forecast: '2.5%',
        previous: '2.9%',
        time: new Date(Date.now() - 28800000),
        sentiment: 'bearish'
      }
    ];

    setNewsItems(mockNews);

    // Simulate real-time updates
    const interval = setInterval(() => {
      const randomUpdate = {
        id: Date.now().toString(),
        title: `Market Flash: ${['USD', 'EUR', 'GBP', 'JPY'][Math.floor(Math.random() * 4)]} Update`,
        description: 'Breaking market news affecting currency pairs',
        impact: ['high', 'medium', 'low'][Math.floor(Math.random() * 3)] as any,
        currency: [['USD', 'EUR', 'GBP', 'JPY'][Math.floor(Math.random() * 4)]],
        time: new Date(),
        sentiment: ['bullish', 'bearish', 'neutral'][Math.floor(Math.random() * 3)] as any
      };

      setNewsItems(prev => [randomUpdate, ...prev.slice(0, 19)]);
    }, 30000); // Update every 30 seconds

    return () => clearInterval(interval);
  }, []);

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high': return 'bg-red-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const getSentimentIcon = (sentiment?: string) => {
    switch (sentiment) {
      case 'bullish': return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'bearish': return <TrendingDown className="h-4 w-4 text-red-500" />;
      default: return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
    }
  };

  const filteredNews = filter === 'all' 
    ? newsItems 
    : newsItems.filter(item => item.impact === filter);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Newspaper className="h-5 w-5" />
            Economic Calendar & News
          </CardTitle>
          <div className="flex gap-2">
            {(['all', 'high', 'medium', 'low'] as const).map(level => (
              <Badge
                key={level}
                variant={filter === level ? 'default' : 'outline'}
                className="cursor-pointer"
                onClick={() => setFilter(level)}
              >
                {level.toUpperCase()}
              </Badge>
            ))}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Alert className="mb-4">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            High impact news can cause significant market volatility. Trade with caution.
          </AlertDescription>
        </Alert>

        <ScrollArea className="h-[600px]">
          <div className="space-y-3">
            {filteredNews.map((item) => (
              <div 
                key={item.id}
                className="p-4 rounded-lg border hover:bg-accent transition-colors"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className={cn(
                      "w-2 h-2 rounded-full",
                      getImpactColor(item.impact)
                    )} />
                    <h4 className="font-medium text-sm">{item.title}</h4>
                    {getSentimentIcon(item.sentiment)}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    {format(item.time, 'HH:mm')}
                  </div>
                </div>
                
                <p className="text-sm text-muted-foreground mb-2">{item.description}</p>
                
                <div className="flex items-center justify-between">
                  <div className="flex gap-1">
                    {item.currency.map(curr => (
                      <Badge key={curr} variant="secondary" className="text-xs">
                        {curr}
                      </Badge>
                    ))}
                  </div>
                  
                  {item.actual && (
                    <div className="flex gap-3 text-xs">
                      <span>
                        <span className="text-muted-foreground">Actual:</span>{' '}
                        <span className="font-medium">{item.actual}</span>
                      </span>
                      {item.forecast && (
                        <span>
                          <span className="text-muted-foreground">Forecast:</span>{' '}
                          <span>{item.forecast}</span>
                        </span>
                      )}
                      {item.previous && (
                        <span>
                          <span className="text-muted-foreground">Previous:</span>{' '}
                          <span>{item.previous}</span>
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}