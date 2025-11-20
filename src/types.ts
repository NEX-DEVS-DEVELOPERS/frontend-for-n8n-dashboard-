
export enum AgentStatus {
  Idle = 'Idle',
  Scheduled = 'Scheduled',
  Running = 'Running',
  Completed = 'Completed',
  Error = 'Error',
  Cancelled = 'Cancelled',
}

export enum LogType {
  Info = 'Info',
  Success = 'Success',
  Error = 'Error',
  Control = 'Control', // For control messages like 'COMPLETE'
}

export enum ValidationStatus {
  Idle = 'Idle', // Not tested yet
  Testing = 'Testing',
  Valid = 'Valid',
  Invalid = 'Invalid',
}

export enum MessageAuthor {
  User = 'user',
  Assistant = 'assistant',
}

export interface ChatMessage {
  author: MessageAuthor;
  text: string;
}

export interface LogEntry {
  type: LogType;
  message: string;
  timestamp: Date;
}

export interface Agent {
  id: string;
  name: string;
  webhookUrl: string;
  schedule: string; // ISO 8601 string from datetime-local input. Empty string if not set.
  status: AgentStatus;
}

export interface TerminalSession {
  id: string;
  agentId: string | null; // Can be null if it's a generic terminal not tied to an agent run
  agentName: string;
  logs: LogEntry[];
  status: AgentStatus;
}

// --- Plan & Pricing Types ---

export type PlanTier = 'free' | 'pro' | 'enterprise';

export interface PricingPlan {
  id: PlanTier;
  name: string;
  price: string;
  description: string;
  features: string[];
  notIncluded: string[];
  popular?: boolean;
  color: string;
}

export interface PlanFeatures {
  id: PlanTier;
  name: string;
  price: number; // Monthly price
  priceString: string;
  requestLimit: number | 'Unlimited'; // Number per week
  responseTimeBusiness: string;
  responseTimeEvening: string;
  channels: string[];
  aiCapability: string;
  healthCheck: boolean;
  securityAudit: boolean;
  freeFixesHours: number;
  priority: 'Normal' | 'High' | 'Highest';
  uptimeMonitoring: boolean;
  dedicatedEngineer: boolean;
  true247Support: boolean; // Included by default?
}
