export type ProviderStatus = 'processing' | 'completed' | 'failed' | 'cancelled';
export interface Provider {
  id: string;
  configured(): boolean;
  submit(providerModel: string, input: Record<string, unknown>): Promise<{ jobId: string }>;
  poll(jobId: string): Promise<{ status: ProviderStatus; outputs: string[]; error?: string; costUsd?: number }>;
  cancel(jobId: string): Promise<void>;
}
