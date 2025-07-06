export interface NotificationPayload {
    to: string | string[];
    subject: string;
    content: string;
    attachments?: any[];
  }
  
  export interface NotificationResult {
    success: boolean;
    id?: string;
    error?: string;
  }