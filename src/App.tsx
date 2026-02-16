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
import PlanDashboard from './components/PlanDashboard';
import RequestChangeModal from './components/RequestChangeModal';
import UserDashboardPopup from './components/UserDashboardPopup';
import UserManagementPage from './components/UserManagementPage';
import AdminApp from './components/admin/AdminApp';
import { io } from 'socket.io-client';
import NotificationDropdown, { Notification } from './components/NotificationDropdown';
import { authApi, n8nApi, agentsApi, notificationApi, dashboardApi } from './services/api';
import { paymentApi, Product } from './services/paymentApi';
import PaymentSuccessPage from './components/PaymentSuccessPage';
import { notificationService } from './services/notificationService';

type Page = 'dashboard' | 'howToUse' | 'support' | 'pricing' | 'subscription' | 'success';

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
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showNotificationDropdown, setShowNotificationDropdown] = useState<boolean>(false);
  const [polarProducts, setPolarProducts] = useState<Product[]>([]);

  const [showWelcomeModal, setShowWelcomeModal] = useState<boolean>(true);
  const [showAddAgentModal, setShowAddAgentModal] = useState<boolean>(false);
  const [showRequestChangeModal, setShowRequestChangeModal] = useState<boolean>(false);
  const [showUserDashboard, setShowUserDashboard] = useState<boolean>(false);
  const [currentPage, setCurrentPage] = useState<Page>('dashboard');

  const pollingIntervalsRef = useRef<Map<string, NodeJS.Timeout>>(new Map());
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
    const validateAuth = async () => {
      try {
        const session = localStorage.getItem('dashboard_session');
        if (session) {
          const { expiresAt } = JSON.parse(session);
          if (new Date().getTime() < expiresAt) {
            setIsAuthenticated(true);

            // Validate with backend and sync plan
            const response = await authApi.validate();
            if (response.success && response.data?.user) {
              const user = response.data.user;
              setUserPlan(user.planTier);
              setHas247Addon(user.has247Addon);
              localStorage.setItem('user_plan', user.planTier);
              localStorage.setItem('has_247_addon', JSON.stringify(user.has247Addon));
            } else {
              // If validation fails, logout
              setIsAuthenticated(false);
              localStorage.removeItem('dashboard_session');
            }

            // Fetch support requests from backend
            try {
              const response = await dashboardApi.getRequests();
              if (response.success && response.data) {
                const weekStart = getWeekStart(new Date());
                const thisWeekRequests = response.data.requests
                  .filter((r: any) => r.type === 'support')
                  .filter((r: any) => {
                    const reqDate = new Date(r.createdAt);
                    return getWeekStart(reqDate) === weekStart;
                  });

                setSupportRequests(thisWeekRequests.map((r: any) => new Date(r.createdAt)));
              }
            } catch (error) {
              console.error('Failed to fetch support requests:', error);
            }
          } else {
            localStorage.removeItem('dashboard_session');
          }
        }
      } catch (error) {
        console.error("Failed to check auth session", error);
        localStorage.removeItem('dashboard_session');
      }
    };

    validateAuth();
    notificationService.requestPermission();
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
          duration: 0.4,
          stagger: 0.05,
          ease: 'power2.out',
          force3D: true,
          delay: 0.1,
        });
      }
    }
  }, [isAuthenticated, currentPage, showWelcomeModal]);


  // Load agents from backend on initial render
  useEffect(() => {
    if (!isAuthenticated) return;

    const fetchAgents = async () => {
      try {
        const response = await agentsApi.getAll();
        if (response.success && response.data?.agents) {
          const fetchedAgents: Agent[] = response.data.agents;

          if (fetchedAgents.length > 0) {
            setShowWelcomeModal(false);
          } else {
            setShowWelcomeModal(true);
          }

          // Re-initialize status based on current time
          const initializedAgents = fetchedAgents.map(agent => ({
            ...agent,
            status: agent.schedule && new Date(agent.schedule) > new Date() ? AgentStatus.Scheduled : AgentStatus.Idle,
          }));

          setAgents(initializedAgents);
        } else {
          setShowWelcomeModal(true);
        }
      } catch (error) {
        console.error("Failed to fetch agents from backend", error);
        setShowWelcomeModal(true);
      }
    };

    fetchAgents();

    // Check for payment success
    const params = new URLSearchParams(window.location.search);
    const checkoutId = params.get('checkout_id');
    if (checkoutId) {
      window.history.replaceState({}, '', '/');
      setCurrentPage('success');
    }

    // Fetch Polar products
    const fetchProducts = async () => {
      try {
        const response = await paymentApi.getProducts();
        if (response.success && response.data) {
          setPolarProducts(response.data as any); // Type assertion needed due to backend response structure
        }
      } catch (error) {
        console.error('Failed to fetch Polar products:', error);
      }
    };
    fetchProducts();

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
    const intervalId = pollingIntervalsRef.current.get(sessionId);
    if (intervalId) {
      clearInterval(intervalId);
      pollingIntervalsRef.current.delete(sessionId);
      addLog(sessionId, LogType.Info, 'Polling stopped by user.');
      // Optionally notify backend to stop execution if API supports it
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

    // Initial UI update
    const log = (type: LogType, message: string) => addLog(newSessionId, type, message);

    try {
      log(LogType.Info, `Triggering agent: "${agent.name}"...`);

      // Call backend proxy
      const response = await n8nApi.triggerWebhook({
        webhookUrl: agent.webhookUrl,
        agentId: agent.id,
        method: agent.method || 'POST',
        payload: agent.inputPayload ? JSON.parse(agent.inputPayload) : undefined
      });

      // Handle potentially nested data structure from apiFetch/backend
      const responsePayload = response.data as any;
      const runId = responsePayload?.data?.runId || responsePayload?.runId;

      if (!response.success || !runId) {
        console.error('Trigger Failed:', response);
        throw new Error(response.error || 'Failed to trigger agent: No Run ID returned');
      }

      // Update session with runId
      const newSession: TerminalSession = {
        id: newSessionId,
        agentId: agent.id,
        agentName: agent.name,
        logs: [],
        status: AgentStatus.Running,
        runId: runId
      };

      setTerminalSessions(prev => [...prev, newSession]);
      setActiveTerminalId(newSessionId);

      log(LogType.Success, `Agent started. Run ID: ${runId}`);
      log(LogType.Info, 'Waiting for logs...');

      // Start polling
      const pollLogs = async () => {
        // Prevent polling if runId is invalid or 'undefined' string
        if (!runId || runId === 'undefined' || typeof runId !== 'string') {
          console.warn('Invalid runId for polling:', runId);
          return;
        }

        try {
          const logsResponse = await n8nApi.pollLogs(runId);

          if (logsResponse.success && logsResponse.data?.logs) {
            const n8nLogs = logsResponse.data.logs;

            // We need to sync these logs with our session logs
            // Since we're polling, we might get duplicates if we just append
            // But our UI helper 'addLog' appends.
            // Better strategy: Update the entire log list for this session in state

            setTerminalSessions(prev => prev.map(session => {
              if (session.id !== newSessionId) return session;

              // Map n8n logs to LogEntry
              const newLogEntries: LogEntry[] = n8nLogs.map((l: any) => {
                let message = l.logMessage;
                try {
                  const parsed = JSON.parse(message);
                  if (parsed && typeof parsed === 'object' && parsed.message) {
                    message = parsed.message;
                  } else if (typeof parsed === 'string') {
                    message = parsed;
                  }
                } catch (e) {
                  // Not JSON
                }

                return {
                  type: l.status === 'error' ? LogType.Error :
                    l.status === 'success' ? LogType.Success :
                      LogType.Info,
                  message: message,
                  timestamp: new Date(l.createdAt)
                };
              });

              // Check if completed
              const isComplete = newLogEntries.some(l => l.type === LogType.Success || l.message.includes('completed'));
              const isError = newLogEntries.some(l => l.type === LogType.Error);

              // Update status if needed
              let newStatus = session.status;
              if (isComplete) newStatus = AgentStatus.Completed;
              if (isError) newStatus = AgentStatus.Error;

              // If status changed to completed/error, stop polling
              if (newStatus !== AgentStatus.Running) {
                const intervalId = pollingIntervalsRef.current.get(newSessionId);
                if (intervalId) {
                  clearInterval(intervalId);
                  pollingIntervalsRef.current.delete(newSessionId);
                }
              }

              return {
                ...session,
                logs: newLogEntries,
                status: newStatus
              };
            }));
          }
        } catch (error) {
          console.error('Polling error', error);
        }
      };

      // Initial poll
      pollLogs();

      // Set interval (1.5s)
      const intervalId = setInterval(pollLogs, 1500);
      pollingIntervalsRef.current.set(newSessionId, intervalId);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';

      // If session exists (it might not if trigger failed early), update it
      // If not, we need to create a failed session to show the error

      const sessionExists = terminalSessions.some(s => s.id === newSessionId);
      if (!sessionExists) {
        // Creates a session just to show the error
        const failedSession: TerminalSession = {
          id: newSessionId,
          agentId: agent.id,
          agentName: agent.name,
          logs: [{
            type: LogType.Error,
            message: `Failed to trigger webhook: ${errorMessage}`,
            timestamp: new Date()
          }],
          status: AgentStatus.Error
        };
        setTerminalSessions(prev => [...prev, failedSession]);
        setActiveTerminalId(newSessionId);
      } else {
        log(LogType.Error, `Failed to trigger webhook: ${errorMessage}`);
        updateSessionStatus(newSessionId, AgentStatus.Error);
      }
    }

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


  const addAgent = async (newAgent: Omit<Agent, 'id' | 'status'>) => {
    try {
      const response = await agentsApi.create(newAgent);
      if (response.success && response.data?.agent) {
        const agent = response.data.agent;
        setAgents(prev => [...prev, agent]);
        setShowAddAgentModal(false);
        setShowWelcomeModal(false);
      } else {
        console.error('Failed to create agent in backend:', response.error);
        alert(`Failed to add agent: ${response.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Failed to add agent:', error);
      alert('Failed to connect to backend to add agent.');
    }
  };

  const deleteAgent = async (agentId: string) => {
    try {
      const response = await agentsApi.delete(agentId);
      if (response.success) {
        const timeoutId = scheduledTimeoutsRef.current.get(agentId);
        if (timeoutId) {
          clearTimeout(timeoutId);
          scheduledTimeoutsRef.current.delete(agentId);
        }

        const sessionsToClose = terminalSessions.filter(s => s.agentId === agentId).map(s => s.id);
        sessionsToClose.forEach(closeTerminal);

        setAgents(prev => prev.filter(a => a.id !== agentId));
      } else {
        console.error('Failed to delete agent in backend:', response.error);
        alert(`Failed to delete agent: ${response.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Failed to delete agent:', error);
      alert('Failed to connect to backend to delete agent.');
    }
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
    let duration = 2 * 60 * 60 * 1000; // Default 2 hours (Free)

    if (userPlan === 'pro') {
      duration = 1 * 60 * 60 * 1000; // 1 hour
    } else if (userPlan === 'enterprise') {
      duration = 15 * 60 * 1000; // 15 mins
    }

    const now = new Date().getTime();

    const activeExpirations = supportRequests
      .map(req => new Date(req).getTime() + duration)
      .filter(exp => exp > now)
      .sort((a, b) => a - b);

    return activeExpirations.length > 0 ? new Date(activeExpirations[0]) : null;
  }, [supportRequests, userPlan]);

  const renderPage = () => {
    switch (currentPage) {
      case 'howToUse':
        return <HowToUsePage />;
      case 'success':
        return <PaymentSuccessPage onGoHome={() => setCurrentPage('dashboard')} />;
      case 'pricing':
        return (
          <PricingPage
            currentPlan={userPlan}
            has247Addon={has247Addon}
            onSelectPlan={async (plan) => {
              if (plan === 'free') {
                // Downgrade logic (cancel plan)
                try {
                  const response = await authApi.cancelPlan();
                  if (response.success && response.data) {
                    const user = response.data;
                    setUserPlan(user.planTier);
                    setHas247Addon(user.has247Addon);
                    localStorage.setItem('user_data', JSON.stringify(user));
                    localStorage.setItem('user_plan', user.planTier);
                    localStorage.setItem('has_247_addon', JSON.stringify(user.has247Addon));
                    alert('Plan cancelled successfully.');
                  }
                } catch (error) {
                  console.error('Failed to cancel plan:', error);
                  alert('Failed to cancel plan.');
                }
              } else {
                // Upgrade logic -> Checkout
                const productName = plan === 'pro' ? 'Pro Plan' : 'Enterprise Plan';
                const product = polarProducts.find(p => p.name === productName);

                if (product) {
                  try {
                    const response = await paymentApi.createCheckout(product.id);
                    if (response.success && response.data?.url) {
                      window.location.href = response.data.url;
                    } else {
                      alert('Failed to create checkout session.');
                    }
                  } catch (error) {
                    console.error('Checkout error:', error);
                    alert('Failed to initiate checkout.');
                  }
                } else {
                  console.error('Product not found:', productName);
                  // Fallback for demo/dev if products not synced
                  // Optimistic update as before
                  setUserPlan(plan);
                  if (plan === 'enterprise') setHas247Addon(true);
                  try {
                    const response = await authApi.updatePlan(plan, plan === 'enterprise' ? true : has247Addon);
                    if (response.success && response.data) {
                      const user = response.data;
                      setUserPlan(user.planTier);
                      setHas247Addon(user.has247Addon);
                      localStorage.setItem('user_data', JSON.stringify(user));
                    }
                  } catch (e) { console.error(e); }
                }
              }
            }}
            onToggleAddon={async () => {
              if (has247Addon) {
                // Remove addon (downgrade logic essentially, manually handle via API needed or portal)
                // For now, allow removing via API
                const newAddonState = false;
                setHas247Addon(newAddonState);
                try {
                  const response = await authApi.updatePlan(userPlan, newAddonState);
                  if (response.success && response.data) {
                    const user = response.data;
                    setHas247Addon(user.has247Addon);
                    localStorage.setItem('user_data', JSON.stringify(user));
                  }
                } catch (e) {
                  console.error(e);
                  setHas247Addon(true); // Revert
                }
              } else {
                // Add addon -> Checkout
                const product = polarProducts.find(p => p.name === '24/7 Support Add-on');
                if (product) {
                  try {
                    const response = await paymentApi.createCheckout(product.id);
                    if (response.success && response.data?.url) {
                      window.location.href = response.data.url;
                    }
                  } catch (error) {
                    console.error('Checkout error:', error);
                  }
                } else {
                  // Fallback
                  setHas247Addon(true);
                  try {
                    await authApi.updatePlan(userPlan, true);
                  } catch (e) { console.error(e); }
                }
              }
            }}
          />
        );
      case 'subscription':
        return (
          <PlanDashboard
            currentPlan={userPlan}
            has247Addon={has247Addon}
            usageCount={supportRequests.length}
            usageLimit={weeklySupportLimit}
            onNavigateToPricing={() => setCurrentPage('pricing')}
            username={JSON.parse(localStorage.getItem('user_data') || '{}').username || 'User'}
            email={JSON.parse(localStorage.getItem('user_data') || '{}').email || ''}
            onOpenChatbot={openChatbot}
            onAddSupportRequest={addSupportRequest}
            nextSupportTicketExpiresAt={nextSupportTicketExpiresAt}
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

  // WebSocket Connection for Real-time Updates
  useEffect(() => {
    if (!isAuthenticated) return;

    const token = localStorage.getItem('auth_token');
    if (!token) return;

    const socket = io('http://localhost:5000', {
      auth: { token },
      transports: ['websocket']
    });

    socket.on('connect', () => {
      console.log('Connected to WebSocket server');
    });

    socket.on('dashboard_update', (data: any) => {
      console.log('Received real-time update:', data);

      // Refresh user data to reflect changes
      const validateAndSync = async () => {
        try {
          const response = await authApi.validate();
          if (response.success && response.data?.user) {
            const user = response.data.user;
            setUserPlan(user.planTier || 'free');
            setHas247Addon(user.has247Addon || false);
            localStorage.setItem('user_data', JSON.stringify(user));
            localStorage.setItem('user_plan', user.planTier);
            localStorage.setItem('has_247_addon', JSON.stringify(user.has247Addon));
          }
        } catch (error) {
          console.error('Failed to sync after update:', error);
        }
      };

      validateAndSync();
    });

    // Listen for new notifications
    socket.on('new_notification', (notification: Notification) => {
      setNotifications(prev => [notification, ...prev]);

      // Trigger browser notification
      notificationService.showNotification(notification.title, {
        body: notification.message,
        tag: notification.id,
        data: { url: window.location.origin }
      });

      // Optional: Auto-show dropdown for critical notifications or play sound
      if (notification.type === 'error' || notification.type === 'support') {
        setShowNotificationDropdown(true);
      }
    });

    // Listen for real-time n8n logs
    socket.on('n8n_log_new', (log: any) => {
      if (!log || !log.runId) return;

      setTerminalSessions(prev => prev.map(session => {
        if (session.runId === log.runId) {
          // Parse message
          let message = log.logMessage;
          try {
            // Try to make it cleaner if it's JSON
            const parsed = JSON.parse(message);
            if (parsed && typeof parsed === 'object' && parsed.message) {
              message = parsed.message;
            } else if (typeof parsed === 'string') {
              message = parsed;
            }
          } catch (e) {
            // Not JSON, keep as is
          }

          const type = log.status === 'error' ? LogType.Error :
            log.status === 'success' ? LogType.Success :
              LogType.Info;

          // Deduplicate based on simple heuristic (message + approx timestamp)
          const isDuplicate = session.logs.some(l =>
            l.message === message &&
            Math.abs(new Date(l.timestamp).getTime() - new Date(log.createdAt).getTime()) < 2000
          );

          if (isDuplicate) return session;

          // Check if completion
          let newStatus = session.status;
          if (type === LogType.Success || message.toLowerCase().includes('completed')) {
            newStatus = AgentStatus.Completed;
            // Stop polling if we get a completion event
            const intervalId = pollingIntervalsRef.current.get(session.id);
            if (intervalId) {
              clearInterval(intervalId);
              pollingIntervalsRef.current.delete(session.id);
            }
          }
          if (type === LogType.Error) {
            newStatus = AgentStatus.Error;
            const intervalId = pollingIntervalsRef.current.get(session.id);
            if (intervalId) {
              clearInterval(intervalId);
              pollingIntervalsRef.current.delete(session.id);
            }
          }

          return {
            ...session,
            logs: [...session.logs, {
              type,
              message,
              timestamp: new Date(log.createdAt)
            }],
            status: newStatus
          };
        }
        return session;
      }));
    });

    return () => {
      socket.disconnect();
    };
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


  // Admin route handling - accessible without authentication (handled by AdminApp)
  if (currentRoute.startsWith('/nexdev')) {
    return <AdminApp />;
  }

  if (!isAuthenticated) {
    return <LoginPage onLoginSuccess={handleLoginSuccess} />;
  }


  return (
    <div className="h-screen flex flex-col bg-transparent text-foreground font-sans z-0 relative overflow-hidden">
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
        supportRequestCount={supportRequests.length}
        weeklySupportLimit={weeklySupportLimit}
        onNavigateToSupport={() => {
          setCurrentPage('support');
          setShowUserDashboard(false);
        }}
        onNavigateToPricing={() => {
          setCurrentPage('pricing');
          setShowUserDashboard(false);
        }}
        onPlanUpdate={(newPlan, has247Addon) => {
          // Update state immediately when plan is canceled
          setUserPlan(newPlan);
          setHas247Addon(has247Addon);
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
        username={JSON.parse(localStorage.getItem('user_data') || '{}').username || 'User'}
        userPlan={userPlan}
        notifications={notifications}
        onMarkNotificationRead={async (id) => {
          setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
          await notificationApi.markAsRead(id);
        }}
        onMarkAllNotificationsRead={async () => {
          setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
          await notificationApi.markAllAsRead();
        }}
        showNotificationDropdown={showNotificationDropdown}
        setShowNotificationDropdown={setShowNotificationDropdown}
      />
      <main className="flex-1 container mx-auto px-4 md:px-8 pt-24 md:pt-32 pb-4 md:pb-6 overflow-y-auto overscroll-contain [perspective:1000px] [backface-visibility:hidden]">
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
