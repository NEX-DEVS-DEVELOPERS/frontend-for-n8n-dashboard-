import React, { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import gsap from 'gsap';
import { AgentStatus, LogEntry, LogType, Agent, TerminalSession, PlanTier } from './types';
import Header from './components/Header';
import AgentManager from './components/AgentManager';
import ProcessLog from './components/ProcessLog';
import WelcomeModal from './components/WelcomeModal';
import AddAgentModal from './components/AddAgentModal';
import HowToUsePage from './components/HowToUsePage';
import SupportPage from './components/SupportPage';
import DashboardStats from './components/DashboardStats';
import SystemWorkflow from './components/SystemWorkflow';
import ChatbotWidget, { ChatbotWidgetRef } from './components/ChatbotWidget';
import LoginPage from './components/LoginPage';
import ParticleBackground from './components/ParticleBackground';
import PricingPage from './components/PricingPage';
import SubscriptionPage from './components/SubscriptionPage';
import RequestChangeModal from './components/RequestChangeModal';
import UserDashboardPopup from './components/UserDashboardPopup';
import UserManagementPage from './components/UserManagementPage';
import { authApi } from './services/api';

type Page = 'dashboard' | 'howToUse' | 'support' | 'pricing' | 'subscription';

const App: React.FC = () => {
  // Route State Management
  const [currentRoute, setCurrentRoute] = useState(window.location.pathname);

  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [terminalSessions, setTerminalSessions] = useState<TerminalSession[]>([]);
  const [activeTerminalId, setActiveTerminalId] = useState<string | null>(null);
  const [supportRequests, setSupportRequests] = useState<Date[]>([]);

  // New State for Plans
  const [userPlan, setUserPlan] = useState<PlanTier>('free');
  const [has247Addon, setHas247Addon] = useState<boolean>(false);

  const [showWelcomeModal, setShowWelcomeModal] = useState<boolean>(true);
  const [showAddAgentModal, setShowAddAgentModal] = useState<boolean>(false);
  const [showRequestChangeModal, setShowRequestChangeModal] = useState<boolean>(false);
  const [showUserDashboard, setShowUserDashboard] = useState<boolean>(false);
  const [currentPage, setCurrentPage] = useState<Page>('dashboard');

  const eventSourcesRef = useRef<Map<string, EventSource>>(new Map());
  const scheduledTimeoutsRef = useRef<Map<string, number>>(new Map());
  const dashboardContainerRef = useRef<HTMLDivElement>(null);
  const chatbotWidgetRef = useRef<ChatbotWidgetRef>(null);

  // Handle browser navigation (back/forward buttons)
  useEffect(() => {
    const handleNavigation = () => setCurrentRoute(window.location.pathname);
    window.addEventListener('popstate', handleNavigation);
    return () => window.removeEventListener('popstate', handleNavigation);
  }, []);

  // Determine weekly support limit based on plan
  const weeklySupportLimit = useMemo(() => {
    if (userPlan === 'pro' || userPlan === 'enterprise') return 'Unlimited';
    return 10; // Free plan
  }, [userPlan]);

  // Get the start of the current week (Sunday)
  const getWeekStart = (date: Date) => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day;
    return new Date(d.setDate(diff)).setHours(0, 0, 0, 0);
  };

  // Check auth status & load state on initial render
  useEffect(() => {
    try {
      const session = localStorage.getItem('dashboard_session');
      if (session) {
        const { expiresAt } = JSON.parse(session);
        if (new Date().getTime() < expiresAt) {
          setIsAuthenticated(true);

          // Load support requests
          const storedRequests = localStorage.getItem('support_requests');
          if (storedRequests) {
            const parsed = JSON.parse(storedRequests);
            if (Array.isArray(parsed)) {
              const currentWeekStart = getWeekStart(new Date());
              const currentWeekRequests = parsed
                .filter(d => typeof d === 'string')
                .map(d => new Date(d))
                .filter(d => !isNaN(d.getTime()) && getWeekStart(d) === currentWeekStart);
              setSupportRequests(currentWeekRequests);
            }
          }

          // Load Plan
          const storedPlan = localStorage.getItem('user_plan');
          if (storedPlan) setUserPlan(storedPlan as PlanTier);

          const storedAddon = localStorage.getItem('has_247_addon');
          if (storedAddon) setHas247Addon(JSON.parse(storedAddon));

        } else {
          localStorage.removeItem('dashboard_session');
        }
      }
    } catch (error) {
      console.error("Failed to check auth session", error);
      localStorage.removeItem('dashboard_session');
    }
  }, []);

  // Animate dashboard cards and manage visibility based on welcome modal
  useEffect(() => {
    const container = dashboardContainerRef.current;
    if (isAuthenticated && currentPage === 'dashboard' && container) {
      const cards = container.querySelectorAll('.dashboard-card-animation');

      gsap.killTweensOf([container, ...Array.from(cards)]);

      if (showWelcomeModal) {
        gsap.set(container, { autoAlpha: 0 });
      } else {
        gsap.set(container, { autoAlpha: 1 });
        gsap.set(cards, { autoAlpha: 0, y: 20, scale: 0.98 });
        gsap.to(cards, {
          autoAlpha: 1,
          y: 0,
          scale: 1,
          duration: 0.7,
          stagger: 0.1,
          ease: 'power2.out',
          force3D: true,
          delay: 0.1,
        });
      }
    }
  }, [isAuthenticated, currentPage, showWelcomeModal]);


  // Load agents from localStorage on initial render
  useEffect(() => {
    if (!isAuthenticated) return;
    try {
      const storedAgents = localStorage.getItem('n8n-agents');
      if (storedAgents) {
        const parsedAgents: Agent[] = JSON.parse(storedAgents);
        setShowWelcomeModal(false);
        const initializedAgents = parsedAgents.map(agent => ({
          ...agent,
          status: agent.schedule && new Date(agent.schedule) > new Date() ? AgentStatus.Scheduled : AgentStatus.Idle,
        }));
        setAgents(initializedAgents);
      } else {
        setShowWelcomeModal(true);
      }
    } catch (error) {
      console.error("Failed to load agents from localStorage", error);
      setShowWelcomeModal(true);
    }
    const initialSessionId = crypto.randomUUID();
    setTerminalSessions([{
      id: initialSessionId,
      agentId: null,
      agentName: 'Terminal',
      logs: [{
        type: LogType.Info,
        message: 'Welcome! Add an n8n agent or ask the assistant for help to get started.',
        timestamp: new Date(),
      }],
      status: AgentStatus.Idle,
    }]);
    setActiveTerminalId(initialSessionId);
  }, [isAuthenticated]);

  // Persist agents
  useEffect(() => {
    if (!isAuthenticated) return;
    try {
      localStorage.setItem('n8n-agents', JSON.stringify(agents));
    } catch (error) {
      console.error("Failed to save agents to localStorage", error);
    }
  }, [agents, isAuthenticated]);

  // Persist support requests
  useEffect(() => {
    if (!isAuthenticated) return;
    try {
      localStorage.setItem('support_requests', JSON.stringify(supportRequests));
    } catch (error) {
      console.error("Failed to save support requests to localStorage", error);
    }
  }, [supportRequests, isAuthenticated]);

  // Persist Plan
  useEffect(() => {
    if (!isAuthenticated) return;
    localStorage.setItem('user_plan', userPlan);
    localStorage.setItem('has_247_addon', JSON.stringify(has247Addon));
  }, [userPlan, has247Addon, isAuthenticated]);


  const addLog = useCallback((sessionId: string, type: LogType, message: string) => {
    const newLog: LogEntry = { type, message, timestamp: new Date() };
    setTerminalSessions(prev =>
      prev.map(session =>
        session.id === sessionId
          ? { ...session, logs: [...session.logs, newLog] }
          : session
      )
    );
  }, []);

  const updateAgentStatus = useCallback((agentId: string, status: AgentStatus) => {
    setAgents(prev => prev.map(a => a.id === agentId ? { ...a, status } : a));
  }, []);

  const updateSessionStatus = useCallback((sessionId: string, status: AgentStatus) => {
    setTerminalSessions(prev => prev.map(s => s.id === sessionId ? { ...s, status } : s));
  }, []);

  const stopAgent = useCallback((sessionId: string) => {
    const eventSource = eventSourcesRef.current.get(sessionId);
    if (eventSource) {
      eventSource.close();
      eventSourcesRef.current.delete(sessionId);
      addLog(sessionId, LogType.Info, 'Terminal closed by user. The connection to the agent has been severed.');
      addLog(sessionId, LogType.Info, 'Note: This action does not terminate the workflow on the n8n server.');
      updateSessionStatus(sessionId, AgentStatus.Cancelled);
    }
  }, [addLog, updateSessionStatus]);

  const closeTerminal = useCallback((sessionId: string) => {
    stopAgent(sessionId); // Stop if running

    setTerminalSessions(prev => {
      const newSessions = prev.filter(s => s.id !== sessionId);
      if (activeTerminalId === sessionId) {
        const newActiveId = newSessions.length > 0 ? newSessions[newSessions.length - 1].id : null;
        setActiveTerminalId(newActiveId);
      }
      return newSessions;
    });
  }, [activeTerminalId, stopAgent]);


  const triggerAgent = useCallback(async (agentId: string) => {
    const agent = agents.find(a => a.id === agentId);
    if (!agent) {
      const targetTerminalId = activeTerminalId || (terminalSessions.length > 0 ? terminalSessions[0].id : null);
      if (targetTerminalId) {
        addLog(targetTerminalId, LogType.Error, "Agent not found.");
      }
      return;
    }

    const newSessionId = crypto.randomUUID();
    const newSession: TerminalSession = {
      id: newSessionId,
      agentId: agent.id,
      agentName: agent.name,
      logs: [],
      status: AgentStatus.Running
    };

    setTerminalSessions(prev => [...prev, newSession]);
    setActiveTerminalId(newSessionId);

    const log = (type: LogType, message: string) => addLog(newSessionId, type, message);

    log(LogType.Info, `Triggering agent: "${agent.name}"...`);
    log(LogType.Info, `POST ${agent.webhookUrl}`);

    let sseUrl: string;

    try {
      const response = await fetch(agent.webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ triggeredBy: 'n8n-dashboard', timestamp: new Date().toISOString() })
      });

      if (!response.ok) {
        throw new Error(`Webhook request failed with status ${response.status}`);
      }

      const responseData = await response.json();

      if (typeof responseData.sseUrl !== 'string' || !responseData.sseUrl) {
        throw new Error("Webhook response is missing the required 'sseUrl' field. Please ensure your n8n workflow returns a JSON object like: { \"sseUrl\": \"...\" }");
      }
      sseUrl = responseData.sseUrl;

      log(LogType.Success, 'Webhook triggered successfully. Waiting for event stream...');
      log(LogType.Info, `Received SSE stream URL. Connecting...`);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
      log(LogType.Error, `Failed to trigger webhook: ${errorMessage}`);
      updateSessionStatus(newSessionId, AgentStatus.Error);
      return;
    }

    const eventSource = new EventSource(sseUrl);
    eventSourcesRef.current.set(newSessionId, eventSource);

    eventSource.onopen = () => {
      log(LogType.Success, 'Log stream connection established.');
    };

    eventSource.onerror = () => {
      log(LogType.Error, 'Connection to agent lost unexpectedly. The workflow may not have completed.');
      updateSessionStatus(newSessionId, AgentStatus.Error);
      eventSourcesRef.current.get(newSessionId)?.close();
      eventSourcesRef.current.delete(newSessionId);
    };

    eventSource.onmessage = (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data);

        if (data.type === 'control') {
          if (data.message === 'COMPLETE') {
            updateSessionStatus(newSessionId, AgentStatus.Completed);
            log(LogType.Success, 'Workflow completed successfully!');
          } else if (data.message === 'ERROR') {
            updateSessionStatus(newSessionId, AgentStatus.Error);
            log(LogType.Error, 'Workflow failed. Check logs for details.');
          }
          eventSourcesRef.current.get(newSessionId)?.close();
          eventSourcesRef.current.delete(newSessionId);
          return;
        }

        if (Object.values(LogType).includes(data.type)) {
          log(data.type, data.message);
        }
      } catch (error) {
        log(LogType.Error, 'Failed to parse incoming log event. Received: ' + event.data);
      }
    };

  }, [agents, addLog, updateSessionStatus, activeTerminalId, terminalSessions]);

  // Scheduling effect
  useEffect(() => {
    if (!isAuthenticated) return;
    const timeouts = scheduledTimeoutsRef.current;
    timeouts.forEach(clearTimeout);
    timeouts.clear();

    agents.forEach(agent => {
      if (agent.schedule) {
        const scheduleTime = new Date(agent.schedule).getTime();
        const now = new Date().getTime();
        const delay = scheduleTime - now;

        if (delay > 0) {
          updateAgentStatus(agent.id, AgentStatus.Scheduled);
          const timeoutId = window.setTimeout(() => {
            const targetTerminalId = activeTerminalId || (terminalSessions.length > 0 ? terminalSessions[0].id : null);
            if (targetTerminalId) {
              addLog(targetTerminalId, LogType.Info, `Executing scheduled run for agent: "${agent.name}"...`);
            }
            triggerAgent(agent.id);
            timeouts.delete(agent.id);
          }, delay);
          timeouts.set(agent.id, timeoutId);
        } else if (agent.status === AgentStatus.Scheduled) {
          updateAgentStatus(agent.id, AgentStatus.Idle);
        }
      }
    });

    return () => {
      scheduledTimeoutsRef.current.forEach(clearTimeout);
    };
  }, [agents, triggerAgent, addLog, updateAgentStatus, isAuthenticated, activeTerminalId, terminalSessions]);


  const addAgent = (newAgent: Omit<Agent, 'id' | 'status'>) => {
    const agent: Agent = {
      ...newAgent,
      id: crypto.randomUUID(),
      status: newAgent.schedule ? AgentStatus.Scheduled : AgentStatus.Idle,
    }
    setAgents(prev => [...prev, agent]);
    setShowAddAgentModal(false);
  };

  const deleteAgent = (agentId: string) => {
    const timeoutId = scheduledTimeoutsRef.current.get(agentId);
    if (timeoutId) {
      clearTimeout(timeoutId);
      scheduledTimeoutsRef.current.delete(agentId);
    }

    const sessionsToClose = terminalSessions.filter(s => s.agentId === agentId).map(s => s.id);
    sessionsToClose.forEach(closeTerminal);

    setAgents(prev => prev.filter(a => a.id !== agentId));
  };

  const stopLatestAgentRun = useCallback((agentId: string) => {
    const runningSessions = terminalSessions.filter(s => s.agentId === agentId && s.status === AgentStatus.Running);
    if (runningSessions.length > 0) {
      const latestSession = runningSessions.reduce((latest, current) => {
        const latestTimestamp = latest.logs.length > 0 ? latest.logs[latest.logs.length - 1].timestamp.getTime() : 0;
        const currentTimestamp = current.logs.length > 0 ? current.logs[current.logs.length - 1].timestamp.getTime() : 0;
        return currentTimestamp > latestTimestamp ? current : latest;
      });
      stopAgent(latestSession.id);
    }
  }, [terminalSessions, stopAgent]);

  const createLogSnapshot = useCallback((sourceSessionId: string) => {
    const sourceSession = terminalSessions.find(s => s.id === sourceSessionId);
    if (!sourceSession) return;

    const snapshotSession: TerminalSession = {
      id: crypto.randomUUID(),
      agentId: sourceSession.agentId,
      agentName: `(Snapshot) ${sourceSession.agentName}`,
      logs: [...sourceSession.logs], // Create a copy of the logs
      status: AgentStatus.Completed, // Mark as static/completed
    };

    setTerminalSessions(prev => [...prev, snapshotSession]);
    setActiveTerminalId(snapshotSession.id);

  }, [terminalSessions]);

  const openChatbot = () => {
    chatbotWidgetRef.current?.open();
  };

  const addSupportRequest = useCallback(() => {
    setSupportRequests(prev => [...prev, new Date()]);
  }, []);

  const nextSupportTicketExpiresAt = useMemo(() => {
    const twoHours = 2 * 60 * 60 * 1000;
    const now = new Date().getTime();

    const activeExpirations = supportRequests
      .map(req => new Date(req).getTime() + twoHours)
      .filter(exp => exp > now)
      .sort((a, b) => a - b);

    return activeExpirations.length > 0 ? new Date(activeExpirations[0]) : null;
  }, [supportRequests]);

  const renderPage = () => {
    switch (currentPage) {
      case 'howToUse':
        return <HowToUsePage />;
      case 'pricing':
        return (
          <PricingPage
            currentPlan={userPlan}
            has247Addon={has247Addon}
            onSelectPlan={async (plan) => {
              // Optimistic update
              setUserPlan(plan);
              if (plan === 'enterprise') setHas247Addon(true);

              // Update backend database
              try {
                const response = await authApi.updatePlan(plan, plan === 'enterprise' ? true : has247Addon);
                if (response.success && response.data) {
                  // Sync with backend response
                  const user = response.data;
                  setUserPlan(user.planTier);
                  setHas247Addon(user.has247Addon);
                  localStorage.setItem('user_data', JSON.stringify(user));
                  localStorage.setItem('user_plan', user.planTier);
                  localStorage.setItem('has_247_addon', JSON.stringify(user.has247Addon));
                }
              } catch (error) {
                console.error('Failed to update plan in backend:', error);
              }
            }}
            onToggleAddon={async () => {
              // Optimistic update
              const newAddonState = !has247Addon;
              setHas247Addon(newAddonState);

              // Update backend database
              try {
                const response = await authApi.updatePlan(userPlan, newAddonState);
                if (response.success && response.data) {
                  // Sync with backend response
                  const user = response.data;
                  setUserPlan(user.planTier);
                  setHas247Addon(user.has247Addon);
                  localStorage.setItem('user_data', JSON.stringify(user));
                  localStorage.setItem('user_plan', user.planTier);
                  localStorage.setItem('has_247_addon', JSON.stringify(user.has247Addon));
                }
              } catch (error) {
                console.error('Failed to update addon in backend:', error);
              }
            }}
          />
        );
      case 'subscription':
        return (
          <SubscriptionPage
            currentPlan={userPlan}
            has247Addon={has247Addon}
            usageCount={supportRequests.length}
            usageLimit={weeklySupportLimit}
            onNavigateToPricing={() => setCurrentPage('pricing')}
          />
        );
      case 'support':
        return (
          <SupportPage
            onOpenChatbot={openChatbot}
            onAddSupportRequest={addSupportRequest}
            requestCount={supportRequests.length}
            requestLimit={typeof weeklySupportLimit === 'number' ? weeklySupportLimit : 999999}
            nextSupportTicketExpiresAt={nextSupportTicketExpiresAt}
          />
        );
      case 'dashboard':
      default:
        return (
          <div ref={dashboardContainerRef} className="flex flex-col gap-8">
            <DashboardStats agents={agents} />
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 items-start">
              <div className="xl:col-span-1 flex flex-col gap-8">
                <AgentManager
                  agents={agents}
                  terminalSessions={terminalSessions}
                  onShowAddAgentModal={() => setShowAddAgentModal(true)}
                  onDeleteAgent={deleteAgent}
                  onTriggerAgent={triggerAgent}
                  onStopAgent={stopLatestAgentRun}
                />
                <SystemWorkflow />
              </div>
              <div className="xl:col-span-2">
                <ProcessLog
                  sessions={terminalSessions}
                  activeSessionId={activeTerminalId}
                  onSelectSession={setActiveTerminalId}
                  onCloseSession={closeTerminal}
                  onStopAgent={stopAgent}
                  onShowAddAgentModal={() => setShowAddAgentModal(true)}
                  onCreateLogSnapshot={createLogSnapshot}
                />
              </div>
            </div>
          </div>
        )
    }
  }

  const handleLoginSuccess = () => {
    const session = {
      expiresAt: new Date().getTime() + 12 * 60 * 60 * 1000, // 12 hours
    };
    localStorage.setItem('dashboard_session', JSON.stringify(session));

    // Load user data and plan from backend (source of truth)
    const userData = localStorage.getItem('user_data');
    if (userData) {
      try {
        const user = JSON.parse(userData);
        setUserPlan(user.planTier || 'free');
        setHas247Addon(user.has247Addon || false);
      } catch (error) {
        console.error('Failed to parse user data:', error);
        setUserPlan('free');
        setHas247Addon(false);
      }
    }

    setIsAuthenticated(true);
  };

  // Session validation with plan synchronization
  useEffect(() => {
    const validateAndSyncPlan = async () => {
      if (!isAuthenticated) return;

      const token = localStorage.getItem('auth_token');
      if (!token) return;

      try {
        const response = await authApi.validate();
        if (response.success && response.data?.user) {
          const user = response.data.user;

          // Update plan from backend (single source of truth)
          setUserPlan(user.planTier || 'free');
          setHas247Addon(user.has247Addon || false);

          // Sync localStorage cache
          localStorage.setItem('user_data', JSON.stringify(user));
          localStorage.setItem('user_plan', user.planTier);
          localStorage.setItem('has_247_addon', JSON.stringify(user.has247Addon));
        }
      } catch (error) {
        console.error('Plan sync failed:', error);
      }
    };

    // Validate on mount and when authentication changes
    validateAndSyncPlan();
  }, [isAuthenticated]);

  const handleLogout = () => {
    localStorage.removeItem('dashboard_session');
    localStorage.removeItem('support_requests');
    localStorage.removeItem('user_plan');
    localStorage.removeItem('has_247_addon');
    setIsAuthenticated(false);
    // Clear state
    setAgents([]);
    setTerminalSessions([]);
    setActiveTerminalId(null);
    setSupportRequests([]);
    setCurrentPage('dashboard');
    setUserPlan('free');
    setHas247Addon(false);
    setShowUserDashboard(false);
  };


  // Admin route handling - accessible without authentication
  if (currentRoute === '/nexdev') {
    return <UserManagementPage />;
  }

  if (!isAuthenticated) {
    return <LoginPage onLoginSuccess={handleLoginSuccess} />;
  }


  return (
    <div className="min-h-full flex flex-col bg-transparent text-foreground font-sans z-0 relative">
      <div className="fixed inset-0 z-[-1] pointer-events-none">
        <ParticleBackground />
      </div>
      {showWelcomeModal && <WelcomeModal onClose={() => setShowWelcomeModal(false)} />}
      {showAddAgentModal && <AddAgentModal onAddAgent={addAgent} onClose={() => setShowAddAgentModal(false)} />}
      {showRequestChangeModal && <RequestChangeModal onClose={() => setShowRequestChangeModal(false)} userPlan={userPlan} />}

      <UserDashboardPopup
        isOpen={showUserDashboard}
        onClose={() => setShowUserDashboard(false)}
        onLogout={handleLogout}
        userPlan={userPlan}
        agents={agents}
        onNavigateToSupport={() => {
          setCurrentPage('support');
          setShowUserDashboard(false);
        }}
        onNavigateToPricing={() => {
          setCurrentPage('pricing');
          setShowUserDashboard(false);
        }}
      />

      <Header
        onNavigateToDashboard={() => setCurrentPage('dashboard')}
        onNavigateToHowToUse={() => setCurrentPage('howToUse')}
        onNavigateToSupport={() => setCurrentPage('support')}
        onNavigateToPricing={() => setCurrentPage('pricing')}
        onNavigateToSubscription={() => setCurrentPage('subscription')}
        onRequestChange={() => setShowRequestChangeModal(true)}
        onLogout={handleLogout}
        onOpenUserDashboard={() => setShowUserDashboard(true)}
        supportRequestCount={supportRequests.length}
        weeklySupportLimit={weeklySupportLimit}
        nextSupportTicketExpiresAt={nextSupportTicketExpiresAt}
      />
      <main className="flex-grow container mx-auto p-4 md:p-8">
        {renderPage()}
      </main>
      <ChatbotWidget
        ref={chatbotWidgetRef}
        agentData={agents}
        logs={terminalSessions.find(s => s.id === activeTerminalId)?.logs || []}
        userPlan={userPlan}
      />
    </div>
  );
};

export default App;
