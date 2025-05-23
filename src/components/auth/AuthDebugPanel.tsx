'use client';

import { useState, useEffect } from 'react';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AuthAuditor, checkSystemStatus, type SystemStatus } from '@/lib/utils/authErrors';
import { Eye, EyeOff, Bug, Users, Database, Wifi, Server, RefreshCw } from 'lucide-react';

export function AuthDebugPanel() {
  const [isVisible, setIsVisible] = useState(false);
  const [logs, setLogs] = useState(() => AuthAuditor.getLogs());
  const [systemStatus, setSystemStatus] = useState<SystemStatus>({
    database: false,
    auth: false,
    api: false
  });
  const [isCheckingStatus, setIsCheckingStatus] = useState(false);
  
  // Só mostrar em desenvolvimento
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  // Verificar status do sistema
  const checkStatus = async () => {
    setIsCheckingStatus(true);
    try {
      const status = await checkSystemStatus();
      setSystemStatus(status);
    } catch (error) {
      console.error('Erro ao verificar status:', error);
    } finally {
      setIsCheckingStatus(false);
    }
  };

  // Verificar status inicial
  useEffect(() => {
    checkStatus();
  }, []);

  // Atualizar logs periodicamente
  useEffect(() => {
    const interval = setInterval(() => {
      setLogs(AuthAuditor.getLogs());
    }, 1000);

    return () => clearInterval(interval);
  }, []);
  
  return (
    <div className="mb-6">
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => setIsVisible(!isVisible)}
        className="mb-4 text-xs"
      >
        <Bug className="w-3 h-3 mr-1" />
        {isVisible ? 'Ocultar Debug' : 'Mostrar Debug'}
        {isVisible ? <EyeOff className="w-3 h-3 ml-1" /> : <Eye className="w-3 h-3 ml-1" />}
      </Button>
      
      {isVisible && (
        <div className="space-y-4">
          {/* Status do Sistema */}
          <Alert>
            <AlertTitle className="flex items-center justify-between">
              <div className="flex items-center">
                <Wifi className="w-4 h-4 mr-2" />
                Status do Sistema
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={checkStatus}
                disabled={isCheckingStatus}
                className="h-6 w-6 p-0"
              >
                <RefreshCw className={`w-3 h-3 ${isCheckingStatus ? 'animate-spin' : ''}`} />
              </Button>
            </AlertTitle>
            <AlertDescription>
              <div className="flex items-center space-x-4 mt-2">
                <span className="flex items-center">
                  <span className={`w-2 h-2 rounded-full mr-2 ${systemStatus.database ? 'bg-green-500' : 'bg-red-500'}`}></span>
                  <Database className="w-3 h-3 mr-1" />
                  Database
                </span>
                <span className="flex items-center">
                  <span className={`w-2 h-2 rounded-full mr-2 ${systemStatus.auth ? 'bg-green-500' : 'bg-red-500'}`}></span>
                  <Server className="w-3 h-3 mr-1" />
                  Auth
                </span>
                <span className="flex items-center">
                  <span className={`w-2 h-2 rounded-full mr-2 ${systemStatus.api ? 'bg-green-500' : 'bg-red-500'}`}></span>
                  <Wifi className="w-3 h-3 mr-1" />
                  API
                </span>
              </div>
            </AlertDescription>
          </Alert>
          
          {/* Usuários Demo */}
          <Alert>
            <AlertTitle className="flex items-center">
              <Users className="w-4 h-4 mr-2" />
              Usuários Demo Disponíveis
            </AlertTitle>
            <AlertDescription>
              <div className="space-y-2 mt-2">
                <div className="flex justify-between items-center p-2 bg-gray-50 dark:bg-gray-800 rounded text-xs">
                  <span className="font-mono">admin@example.com</span>
                  <span className="font-mono">admin123</span>
                  <Badge variant="outline" className="text-xs">Admin</Badge>
                </div>
                <div className="flex justify-between items-center p-2 bg-gray-50 dark:bg-gray-800 rounded text-xs">
                  <span className="font-mono">demo@example.com</span>
                  <span className="font-mono">demo123</span>
                  <Badge variant="outline" className="text-xs">User</Badge>
                </div>
              </div>
            </AlertDescription>
          </Alert>

          {/* Informações do Ambiente */}
          <Alert>
            <AlertTitle className="flex items-center">
              <Server className="w-4 h-4 mr-2" />
              Informações do Ambiente
            </AlertTitle>
            <AlertDescription>
              <div className="space-y-1 mt-2 text-xs">
                <div className="flex justify-between">
                  <span>NODE_ENV:</span>
                  <Badge variant="outline">{process.env.NODE_ENV}</Badge>
                </div>
                <div className="flex justify-between">
                  <span>NextAuth URL:</span>
                  <span className="font-mono text-xs">{typeof window !== 'undefined' ? window.location.origin : 'Server'}</span>
                </div>
                <div className="flex justify-between">
                  <span>Timestamp:</span>
                  <span className="font-mono text-xs">{new Date().toLocaleString()}</span>
                </div>
              </div>
            </AlertDescription>
          </Alert>
          
          {/* Logs de Auditoria */}
          {logs.length > 0 && (
            <Alert>
              <AlertTitle className="flex items-center justify-between">
                <div className="flex items-center">
                  <Database className="w-4 h-4 mr-2" />
                  Logs de Auditoria (Últimos {logs.length})
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    AuthAuditor.clearLogs();
                    setLogs([]);
                  }}
                  className="h-6 text-xs"
                >
                  Limpar
                </Button>
              </AlertTitle>
              <AlertDescription>
                <div className="space-y-1 mt-2 max-h-32 overflow-y-auto">
                  {logs.slice(-5).reverse().map((log, index) => (
                    <div key={index} className="text-xs font-mono bg-gray-50 dark:bg-gray-800 p-2 rounded flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className={log.success ? 'text-green-600' : 'text-red-600'}>
                          {log.success ? '✓' : '✗'}
                        </span>
                        <span>{log.action}</span>
                        {log.email && (
                          <span className="text-blue-600 truncate max-w-24">{log.email}</span>
                        )}
                      </div>
                      <div className="flex items-center space-x-2">
                        {log.errorCode && (
                          <Badge variant="destructive" className="text-xs">
                            {log.errorCode}
                          </Badge>
                        )}
                        <span className="text-gray-500">
                          {log.timestamp.toLocaleTimeString()}
                        </span>
                      </div>
                    </div>
                  ))}
                  {logs.length === 0 && (
                    <div className="text-xs text-gray-500 italic p-2">
                      Nenhum log de auditoria ainda...
                    </div>
                  )}
                </div>
              </AlertDescription>
            </Alert>
          )}
        </div>
      )}
    </div>
  );
} 