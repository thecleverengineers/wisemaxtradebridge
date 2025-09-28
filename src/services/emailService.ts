import { supabase } from "@/integrations/supabase/client";

export interface EmailOptions {
  to: string;
  subject: string;
  html?: string;
  text?: string;
  type?: 'welcome' | 'verification' | 'trade' | 'withdrawal' | 'deposit' | 'generic';
}

export const sendEmail = async (options: EmailOptions) => {
  try {
    console.log('Sending email to:', options.to);
    console.log('Email type:', options.type);
    
    // Call the edge function directly with full URL
    const response = await fetch('https://verauoklhuanklwsuwrr.supabase.co/functions/v1/send-email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZlcmF1b2tsaHVhbmtsd3N1d3JyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkwMzM0NDAsImV4cCI6MjA3NDYwOTQ0MH0.rsHRaU1iupd3Ma0OQ8zomX6WFaiZYVBxjD7HTRNmG3c',
      },
      body: JSON.stringify(options),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('Edge function error:', error);
      throw new Error(error.details || error.error || 'Failed to send email');
    }

    const data = await response.json();
    console.log('Email sent successfully:', data);
    return data;
  } catch (error) {
    console.error('Failed to send email:', error);
    throw error;
  }
};

// Send welcome email to new users
export const sendWelcomeEmail = async (email: string, name?: string) => {
  return sendEmail({
    to: email,
    subject: 'Welcome to Trading Platform!',
    type: 'welcome',
    html: `
      <h1>Welcome ${name || 'Trader'}!</h1>
      <p>Thank you for joining our trading platform.</p>
      <p>Your account has been successfully created.</p>
    `
  });
};

// Send email verification
export const sendVerificationEmail = async (email: string, code: string) => {
  return sendEmail({
    to: email,
    subject: 'Verify Your Email',
    type: 'verification',
    html: `
      <h1>Email Verification</h1>
      <p>Please verify your email address using the code below:</p>
      <h2>${code}</h2>
      <p>This code will expire in 24 hours.</p>
    `
  });
};

// Send trade confirmation
export const sendTradeConfirmation = async (email: string, tradeDetails: any) => {
  return sendEmail({
    to: email,
    subject: 'Trade Confirmation',
    type: 'trade',
    html: `
      <h1>Trade Executed Successfully</h1>
      <p>Your trade has been executed:</p>
      <ul>
        <li>Asset: ${tradeDetails.asset}</li>
        <li>Type: ${tradeDetails.type}</li>
        <li>Amount: ${tradeDetails.amount}</li>
        <li>Price: ${tradeDetails.price}</li>
      </ul>
    `
  });
};

// Send withdrawal notification
export const sendWithdrawalNotification = async (email: string, amount: number, status: string) => {
  return sendEmail({
    to: email,
    subject: 'Withdrawal Request Update',
    type: 'withdrawal',
    html: `
      <h1>Withdrawal Request ${status}</h1>
      <p>Your withdrawal request for $${amount} has been ${status.toLowerCase()}.</p>
      ${status === 'Approved' ? '<p>Funds will be transferred within 1-3 business days.</p>' : ''}
    `
  });
};

// Send deposit confirmation
export const sendDepositConfirmation = async (email: string, amount: number) => {
  return sendEmail({
    to: email,
    subject: 'Deposit Confirmed',
    type: 'deposit',
    html: `
      <h1>Deposit Successful</h1>
      <p>Your deposit of $${amount} has been confirmed and credited to your account.</p>
      <p>You can now start trading with your updated balance.</p>
    `
  });
};