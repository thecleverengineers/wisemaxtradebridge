import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, Globe } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Session {
  name: string;
  city: string;
  open: string;
  close: string;
  isOpen: boolean;
  volume: 'high' | 'medium' | 'low';
}

export function MarketSession() {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [sessions, setSessions] = useState<Session[]>([]);

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      setCurrentTime(now);
      updateSessions(now);
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const updateSessions = (now: Date) => {
    const utcHour = now.getUTCHours();
    
    const marketSessions: Session[] = [
      {
        name: 'Sydney',
        city: 'Sydney',
        open: '21:00',
        close: '06:00',
        isOpen: utcHour >= 21 || utcHour < 6,
        volume: utcHour >= 21 || utcHour < 6 ? 'low' : 'low'
      },
      {
        name: 'Tokyo',
        city: 'Tokyo',
        open: '00:00',
        close: '09:00',
        isOpen: utcHour >= 0 && utcHour < 9,
        volume: utcHour >= 0 && utcHour < 9 ? 'medium' : 'low'
      },
      {
        name: 'London',
        city: 'London',
        open: '08:00',
        close: '17:00',
        isOpen: utcHour >= 8 && utcHour < 17,
        volume: utcHour >= 8 && utcHour < 17 ? 'high' : 'low'
      },
      {
        name: 'New York',
        city: 'New York',
        open: '13:00',
        close: '22:00',
        isOpen: utcHour >= 13 && utcHour < 22,
        volume: utcHour >= 13 && utcHour < 22 ? 'high' : 'low'
      }
    ];

    setSessions(marketSessions);
  };

  const getVolumeColor = (volume: string) => {
    switch (volume) {
      case 'high': return 'text-green-500';
      case 'medium': return 'text-yellow-500';
      case 'low': return 'text-muted-foreground';
      default: return 'text-muted-foreground';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Globe className="h-5 w-5" />
          Market Sessions (24/5)
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-2 mb-4 text-sm text-muted-foreground">
          <Clock className="h-4 w-4" />
          <span>UTC Time: {currentTime.toUTCString().split(' ')[4]}</span>
        </div>
        
        <div className="space-y-3">
          {sessions.map((session) => (
            <div 
              key={session.name}
              className={cn(
                "flex items-center justify-between p-3 rounded-lg border",
                session.isOpen ? "bg-accent border-primary/50" : "bg-background"
              )}
            >
              <div className="flex items-center gap-3">
                <div className={cn(
                  "w-2 h-2 rounded-full",
                  session.isOpen ? "bg-green-500 animate-pulse" : "bg-muted-foreground"
                )} />
                <div>
                  <p className="font-medium">{session.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {session.open} - {session.close} UTC
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <Badge variant={session.isOpen ? "default" : "outline"}>
                  {session.isOpen ? 'OPEN' : 'CLOSED'}
                </Badge>
                <span className={cn("text-sm", getVolumeColor(session.volume))}>
                  {session.volume.toUpperCase()}
                </span>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 p-3 bg-accent rounded-lg">
          <p className="text-xs text-muted-foreground">
            <strong>Best Trading Times:</strong> London-NY overlap (13:00-17:00 UTC)
          </p>
        </div>
      </CardContent>
    </Card>
  );
}