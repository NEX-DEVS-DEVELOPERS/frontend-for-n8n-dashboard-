import React, { useRef, useEffect, useState, useCallback } from 'react';
import gsap from 'gsap';
import { AgentStatus, LogEntry, LogType, TerminalSession } from '../types';
import { XIcon, TerminalIcon, CloneIcon, ArrowsPointingOutIcon, ServerIcon } from './icons';
import { Card, CardContent, cn, Button } from './ui';

interface ProcessLogProps {
  sessions: TerminalSession[];
  activeSessionId: string | null;
  onSelectSession: (sessionId: string) => void;
  onCloseSession: (sessionId: string) => void;
  onStopAgent: (sessionId: string) => void;
  onShowAddAgentModal: () => void;
  onCreateLogSnapshot: (sessionId: string) => void;
}

const ProcessLog: React.FC<ProcessLogProps> = ({ sessions, activeSessionId, onSelectSession, onCloseSession, onStopAgent, onShowAddAgentModal, onCreateLogSnapshot }) => {
  const terminalBodyRef = useRef<HTMLDivElement>(null);
  const logsEndRef = useRef<HTMLDivElement>(null);
  const [isMinimized, setIsMinimized] = useState(false);

  const activeSession = sessions.find(s => s.id === activeSessionId) || null;

  // Auto-scroll to bottom when new logs arrive
  useEffect(() => {
    if (logsEndRef.current && !isMinimized) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [activeSession?.logs.length, isMinimized]);

  const getStatusColor = useCallback((status: AgentStatus) => {
    switch (status) {
      case AgentStatus.Running:
        return 'bg-green-500 shadow-[0_0_5px_rgba(34,197,94,0.5)]';
      case AgentStatus.Stopped:
        return 'bg-red-500 shadow-[0_0_5px_rgba(239,68,68,0.5)]';
      case AgentStatus.Paused:
        return 'bg-yellow-500 shadow-[0_0_5px_rgba(234,179,8,0.5)]';
      default:
        return 'bg-gray-500';
    }
  }, []);

  const getLogColor = useCallback((type: LogType) => {
    switch (type) {
      case LogType.Info:
        return 'text-cyan-600 dark:text-cyan-400';
      case LogType.Success:
        return 'text-green-600 dark:text-green-400';
      case LogType.Error:
        return 'text-red-600 dark:text-red-400';
      case LogType.Control:
        return 'text-gray-500';
      default:
        return 'text-gray-700 dark:text-gray-300';
    }
  }, []);

  const getLogPrefix = useCallback((type: LogType) => {
    switch (type) {
      case LogType.Info:
        return 'INFO';
      case LogType.Success:
        return 'SUCCESS';
      case LogType.Error:
        return 'ERROR';
      case LogType.Control:
        return 'CTRL';
      default:
        return 'LOG';
    }
  }, []);

  const handleRedClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (activeSessionId) {
      onStopAgent(activeSessionId);
    }
  };

  const handleYellowClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onShowAddAgentModal();
  };

  const handleGreenClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsMinimized(!isMinimized);
  };


  return (
    <Card className={cn(
      "w-full bg-gray-100 dark:bg-[#0f0f0f] text-gray-900 dark:text-white font-mono text-sm shadow-2xl border-0 overflow-hidden flex flex-col transition-all duration-500 ease-in-out hover:shadow-[0_0_30px_rgba(0,0,0,0.2)] dark:hover:shadow-[0_0_30px_rgba(0,0,0,0.5)]",
      isMinimized ? "min-h-[48px] h-[48px]" : "min-h-[600px] h-[600px]"
    )}>
      {/* Terminal Header */}
      <div
        className="flex items-center justify-between px-5 bg-gray-200 dark:bg-[#1a1a1a] border-b border-gray-300 dark:border-[#333] h-12 shrink-0 select-none cursor-default"
        onDoubleClick={() => setIsMinimized(!isMinimized)}
      >
        <div className="flex items-center gap-4">
          <div className="flex gap-2.5 group">
            {/* Red: Kill Agent */}
            <div
              onClick={handleRedClick}
              className="w-3 h-3 rounded-full bg-[#ff5f56] border border-[#e0443e] shadow-sm group-hover:brightness-110 transition-all cursor-pointer flex items-center justify-center overflow-hidden relative"
              title="Kill Agent Process"
            >
              <div className="opacity-0 group-hover:opacity-100 absolute inset-0 flex items-center justify-center bg-black/10">
                <div className="w-1.5 h-1.5 bg-black/60 rounded-full" />
              </div>
            </div>

            {/* Yellow: Add Agent */}
            <div
              onClick={handleYellowClick}
              className="w-3 h-3 rounded-full bg-[#ffbd2e] border border-[#dea123] shadow-sm group-hover:brightness-110 transition-all cursor-pointer flex items-center justify-center overflow-hidden relative"
              title="Add New Agent"
            >
              <div className="opacity-0 group-hover:opacity-100 absolute inset-0 flex items-center justify-center bg-black/10">
                <div className="w-1.5 h-0.5 bg-black/60 rounded-full" />
              </div>
            </div>

            {/* Green: Minimize */}
            <div
              onClick={handleGreenClick}
              className="w-3 h-3 rounded-full bg-[#27c93f] border border-[#1aab29] shadow-sm group-hover:brightness-110 transition-all cursor-pointer flex items-center justify-center overflow-hidden relative"
              title={isMinimized ? "Expand Terminal" : "Minimize Terminal"}
            >
              <div className="opacity-0 group-hover:opacity-100 absolute inset-0 flex items-center justify-center bg-black/10">
                {isMinimized ? (
                  <div className="w-0 h-0 border-l-[3px] border-l-transparent border-r-[3px] border-r-transparent border-b-[4px] border-b-black/60" />
                ) : (
                  <div className="w-0 h-0 border-l-[3px] border-l-transparent border-r-[3px] border-r-transparent border-t-[4px] border-t-black/60" />
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 px-3 py-1 rounded-md bg-white/50 dark:bg-[#333]/50 border border-gray-300 dark:border-white/5 text-xs text-gray-600 dark:text-gray-400 font-medium">
            <TerminalIcon className="h-3.5 w-3.5" />
            <span>n8n-agent-terminal</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {activeSessionId && !isMinimized && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onCreateLogSnapshot(activeSessionId)}
              className="h-7 px-2 text-xs text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10 gap-2 transition-colors"
              title="Create Snapshot"
            >
              <CloneIcon className="h-4 w-4" />
              <span className="hidden sm:inline">Snapshot</span>
            </Button>
          )}
          {activeSession?.status === AgentStatus.Running && (
            <div className="flex items-center gap-2 px-2 py-1 rounded bg-cyan-500/10 border border-cyan-500/20">
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-cyan-600 dark:border-cyan-400 border-t-transparent" />
              <span className="text-xs text-cyan-700 dark:text-cyan-400 font-medium">Processing</span>
            </div>
          )}
        </div>
      </div>

      {/* Content Wrapper for smooth height transition */}
      <div className={cn(
        "flex flex-col flex-1 overflow-hidden transition-all duration-500 ease-in-out",
        isMinimized ? "opacity-0 max-h-0" : "opacity-100 max-h-[800px]"
      )}>
        {/* Tabs Bar */}
        <div className="flex items-end bg-gray-300 dark:bg-[#121212] border-b border-gray-300 dark:border-[#333] px-2 gap-1 overflow-x-auto scrollbar-hide h-10 shrink-0 pt-1">
          {sessions.map(session => (
            <div
              key={session.id}
              onClick={() => onSelectSession(session.id)}
              className={`
                group flex items-center gap-2 px-4 py-2 max-w-[180px] rounded-t-lg text-xs cursor-pointer transition-all select-none border-x border-t
                ${activeSessionId === session.id
                  ? 'bg-gray-100 dark:bg-[#0f0f0f] text-gray-900 dark:text-white font-bold border-gray-300 dark:border-[#333] border-b-0 relative top-[1px] z-10 shadow-sm'
                  : 'bg-gray-200 dark:bg-[#1a1a1a] text-gray-500 dark:text-gray-500 border-transparent hover:bg-gray-100 dark:hover:bg-[#252525] hover:text-gray-700 dark:hover:text-gray-300'
                }
              `}
            >
              <div className={`w-2 h-2 rounded-full ${getStatusColor(session.status)}`} />
              <span className="truncate flex-1">{session.agentName}</span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onCloseSession(session.id);
                }}
                className={`
                  p-0.5 rounded-sm opacity-0 group-hover:opacity-100 hover:bg-black/10 dark:hover:bg-white/10 transition-all
                  ${activeSessionId === session.id ? 'text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white' : 'text-gray-400 dark:text-gray-600 hover:text-gray-600 dark:hover:text-gray-300'}
                `}
              >
                <XIcon className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>

        {/* Terminal Body */}
        <CardContent className="flex-1 p-5 overflow-y-auto font-mono text-[13px] leading-relaxed scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-[#333] scrollbar-track-transparent bg-gray-100 dark:bg-[#0f0f0f]" ref={terminalBodyRef}>
          {activeSession ? (
            <div className="space-y-1.5">
              {activeSession.logs.filter(log => log.type !== LogType.Control).map((log, index) => (
                <div key={index} className="flex gap-3 group hover:bg-black/5 dark:hover:bg-white/[0.02] -mx-2 px-2 py-0.5 rounded transition-colors items-start">
                  <span className="text-gray-400 dark:text-gray-600 select-none w-8 text-right shrink-0 opacity-50 group-hover:opacity-100 transition-opacity">{index + 1}</span>
                  <div className="flex-1 break-all flex gap-3">
                    <span className="text-gray-500 dark:text-gray-500 shrink-0 select-none w-16 text-[11px] pt-0.5 opacity-70">
                      {log.timestamp.toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </span>
                    <div className="flex-1">
                      <span className={`font-bold mr-2 select-none ${getLogColor(log.type)}`}>
                        {getLogPrefix(log.type)}
                      </span>
                      <span className={`${log.type === LogType.Error ? 'text-red-600 dark:text-red-300' : 'text-gray-700 dark:text-gray-300'}`}>
                        {log.message}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
              {activeSession.status === AgentStatus.Running && (
                <div className="flex gap-3 px-2 py-1 animate-pulse">
                  <span className="text-gray-400 dark:text-gray-600 w-8 text-right">~</span>
                  <span className="text-cyan-600 dark:text-cyan-400">_</span>
                </div>
              )}
              <div ref={logsEndRef} />
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-gray-400 dark:text-gray-600 space-y-4 opacity-50">
              <TerminalIcon className="h-12 w-12 mb-2" />
              <p className="text-sm">No active terminal session</p>
              <Button variant="outline" size="sm" onClick={onShowAddAgentModal} className="border-dashed border-gray-400 dark:border-gray-600 hover:border-gray-600 dark:hover:border-gray-400 hover:bg-black/5 dark:hover:bg-white/5 text-gray-600 dark:text-gray-400">
                Start New Agent
              </Button>
            </div>
          )}
        </CardContent>

        {/* Footer Status Bar */}
        <div className="h-8 bg-[#449B96] flex items-center px-3 justify-between text-white select-none shrink-0 shadow-[0_-1px_10px_rgba(0,0,0,0.1)]">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-xs font-medium">
              <ArrowsPointingOutIcon className="h-3.5 w-3.5" />
              <span>SSH: Connected</span>
            </div>
            <div className="flex items-center gap-2 text-xs opacity-80">
              <ServerIcon className="h-3.5 w-3.5" />
              <span>n8n-server-01</span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            {activeSession?.status === AgentStatus.Running && (
              <div className="flex items-center gap-2 text-xs px-3 py-1.5 bg-white/10 rounded-full animate-pulse">
                <div className="w-1.5 h-1.5 rounded-full bg-white" />
                <span>Listening for events...</span>
              </div>
            )}
            <div className="text-[10px] opacity-60 font-mono">
              UTF-8
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default ProcessLog;
