
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Activity, 
  Server, 
  Database, 
  Users, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle,
  XCircle,
  Clock,
  Cpu,
  HardDrive,
  Wifi,
  BarChart3
} from 'lucide-react';

interface SystemMetric {
  id: string;
  name: string;
  value: number;
  unit: string;
  status: 'good' | 'warning' | 'critical';
  lastUpdated: Date;
}

interface ServiceStatus {
  service: string;
  status: 'online' | 'offline' | 'degraded';
  uptime: number;
  responseTime: number;
  lastCheck: Date;
}

export const SystemMonitor = () => {
  const [metrics, setMetrics] = useState<SystemMetric[]>([]);
  const [services, setServices] = useState<ServiceStatus[]>([]);
  const [realTimeData, setRealTimeData] = useState(true);

  useEffect(() => {
    loadSystemMetrics();
    const interval = setInterval(loadSystemMetrics, 5000);
    return () => clearInterval(interval);
  }, []);

  const loadSystemMetrics = () => {
    // Mock real-time system metrics
    const mockMetrics: SystemMetric[] = [
      {
        id: 'cpu',
        name: 'CPU Usage',
        value: Math.random() * 100,
        unit: '%',
        status: Math.random() > 0.8 ? 'warning' : 'good',
        lastUpdated: new Date()
      },
      {
        id: 'memory',
        name: 'Memory Usage',
        value: Math.random() * 100,
        unit: '%',
        status: Math.random() > 0.9 ? 'critical' : 'good',
        lastUpdated: new Date()
      },
      {
        id: 'disk',
        name: 'Disk Usage',
        value: Math.random() * 100,
        unit: '%',
        status: 'good',
        lastUpdated: new Date()
      },
      {
        id: 'network',
        name: 'Network I/O',
        value: Math.random() * 1000,
        unit: 'MB/s',
        status: 'good',
        lastUpdated: new Date()
      },
      {
        id: 'activeUsers',
        name: 'Active Users',
        value: Math.floor(Math.random() * 500) + 100,
        unit: 'users',
        status: 'good',
        lastUpdated: new Date()
      },
      {
        id: 'transactions',
        name: 'Transactions/min',
        value: Math.floor(Math.random() * 1000) + 200,
        unit: 'tx/min',
        status: 'good',
        lastUpdated: new Date()
      }
    ];

    const mockServices: ServiceStatus[] = [
      {
        service: 'Trading Engine',
        status: Math.random() > 0.95 ? 'degraded' : 'online',
        uptime: 99.9,
        responseTime: Math.random() * 100 + 50,
        lastCheck: new Date()
      },
      {
        service: 'Database',
        status: 'online',
        uptime: 99.95,
        responseTime: Math.random() * 50 + 20,
        lastCheck: new Date()
      },
      {
        service: 'Authentication',
        status: 'online',
        uptime: 99.8,
        responseTime: Math.random() * 80 + 30,
        lastCheck: new Date()
      },
      {
        service: 'Payment Gateway',
        status: Math.random() > 0.98 ? 'offline' : 'online',
        uptime: 99.7,
        responseTime: Math.random() * 200 + 100,
        lastCheck: new Date()
      },
      {
        service: 'WebSocket Server',
        status: 'online',
        uptime: 99.9,
        responseTime: Math.random() * 30 + 10,
        lastCheck: new Date()
      }
    ];

    setMetrics(mockMetrics);
    setServices(mockServices);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'good':
      case 'online':
        return 'bg-green-600';
      case 'warning':
      case 'degraded':
        return 'bg-yellow-600';
      case 'critical':
      case 'offline':
        return 'bg-red-600';
      default:
        return 'bg-gray-600';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'good':
      case 'online':
        return <CheckCircle className="h-4 w-4" />;
      case 'warning':
      case 'degraded':
        return <AlertTriangle className="h-4 w-4" />;
      case 'critical':
      case 'offline':
        return <XCircle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white font-display">System Monitor</h2>
          <p className="text-purple-300">Real-time system health and performance monitoring</p>
        </div>
        <div className="flex items-center gap-3">
          <Badge className={realTimeData ? 'bg-green-600' : 'bg-red-600'}>
            <Activity className="h-4 w-4 mr-2" />
            {realTimeData ? 'Live' : 'Offline'}
          </Badge>
          <Button
            variant="outline"
            onClick={() => setRealTimeData(!realTimeData)}
            className="border-white/20 text-white"
          >
            {realTimeData ? 'Pause' : 'Resume'} Updates
          </Button>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="bg-white/5 border-white/10">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="services">Services</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="alerts">Alerts</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {metrics.map((metric) => (
              <Card key={metric.id} className="bg-white/5 border-white/10">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {metric.id === 'cpu' && <Cpu className="h-5 w-5 text-purple-400" />}
                      {metric.id === 'memory' && <Server className="h-5 w-5 text-blue-400" />}
                      {metric.id === 'disk' && <HardDrive className="h-5 w-5 text-green-400" />}
                      {metric.id === 'network' && <Wifi className="h-5 w-5 text-yellow-400" />}
                      {metric.id === 'activeUsers' && <Users className="h-5 w-5 text-cyan-400" />}
                      {metric.id === 'transactions' && <BarChart3 className="h-5 w-5 text-orange-400" />}
                      <span className="text-white font-semibold">{metric.name}</span>
                    </div>
                    <Badge className={getStatusColor(metric.status)}>
                      {getStatusIcon(metric.status)}
                    </Badge>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-bold text-white">
                      {metric.value.toFixed(metric.unit === '%' ? 1 : 0)}
                    </span>
                    <span className="text-purple-300">{metric.unit}</span>
                  </div>
                  <p className="text-xs text-purple-300 mt-1">
                    Updated {metric.lastUpdated.toLocaleTimeString()}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="services" className="space-y-4">
          <div className="grid gap-4">
            {services.map((service) => (
              <Card key={service.service} className="bg-white/5 border-white/10">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Badge className={getStatusColor(service.status)}>
                        {getStatusIcon(service.status)}
                      </Badge>
                      <div>
                        <h3 className="text-white font-semibold">{service.service}</h3>
                        <p className="text-purple-300 text-sm">
                          Uptime: {service.uptime}% | Response: {service.responseTime.toFixed(0)}ms
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-white text-sm">Status: {service.status}</p>
                      <p className="text-purple-300 text-xs">
                        Last check: {service.lastCheck.toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          <Card className="bg-white/5 border-white/10">
            <CardHeader>
              <CardTitle className="text-white">Performance Metrics</CardTitle>
              <CardDescription className="text-purple-300">
                Detailed system performance over time
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {metrics.filter(m => ['cpu', 'memory', 'disk'].includes(m.id)).map((metric) => (
                  <div key={metric.id} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-white font-semibold">{metric.name}</span>
                      <span className="text-purple-300">{metric.value.toFixed(1)}{metric.unit}</span>
                    </div>
                    <div className="w-full bg-white/10 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all duration-300 ${
                          metric.status === 'good' ? 'bg-green-500' :
                          metric.status === 'warning' ? 'bg-yellow-500' : 'bg-red-500'
                        }`}
                        style={{ width: `${Math.min(metric.value, 100)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="alerts" className="space-y-4">
          <div className="space-y-4">
            {metrics.filter(m => m.status !== 'good').length === 0 ? (
              <Card className="bg-white/5 border-white/10">
                <CardContent className="p-6 text-center">
                  <CheckCircle className="h-12 w-12 text-green-400 mx-auto mb-4" />
                  <h3 className="text-white font-semibold mb-2">All Systems Operational</h3>
                  <p className="text-purple-300">No active alerts or warnings</p>
                </CardContent>
              </Card>
            ) : (
              <>
                {metrics.filter(m => m.status === 'critical').map((metric) => (
                  <Card key={metric.id} className="bg-red-600/20 border-red-500/50">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <XCircle className="h-5 w-5 text-red-400" />
                        <div>
                          <h4 className="text-white font-semibold">Critical: {metric.name}</h4>
                          <p className="text-red-300 text-sm">
                            Value: {metric.value.toFixed(1)}{metric.unit} - Immediate attention required
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                
                {metrics.filter(m => m.status === 'warning').map((metric) => (
                  <Card key={metric.id} className="bg-yellow-600/20 border-yellow-500/50">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <AlertTriangle className="h-5 w-5 text-yellow-400" />
                        <div>
                          <h4 className="text-white font-semibold">Warning: {metric.name}</h4>
                          <p className="text-yellow-300 text-sm">
                            Value: {metric.value.toFixed(1)}{metric.unit} - Monitor closely
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};
