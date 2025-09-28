import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { SMTPClient } from "https://deno.land/x/denomailer@1.6.0/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface EmailRequest {
  to: string;
  subject: string;
  html?: string;
  text?: string;
  type?: 'welcome' | 'verification' | 'trade' | 'withdrawal' | 'deposit' | 'generic';
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { to, subject, html, text, type = 'generic' }: EmailRequest = await req.json();

    // Validate required fields
    if (!to || !subject || (!html && !text)) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: to, subject, and either html or text" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Get SMTP configuration from environment variables
    const smtpHost = Deno.env.get("SMTP_HOST");
    const smtpPort = parseInt(Deno.env.get("SMTP_PORT") || "587");
    const smtpUser = Deno.env.get("SMTP_USER");
    const smtpPassword = Deno.env.get("SMTP_PASSWORD");

    if (!smtpHost || !smtpUser || !smtpPassword) {
      console.error("Missing SMTP configuration");
      return new Response(
        JSON.stringify({ error: "Email service not configured" }),
        {
          status: 500,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Create SMTP client
    const client = new SMTPClient({
      connection: {
        hostname: smtpHost,
        port: smtpPort,
        tls: smtpPort === 465, // Use TLS for port 465, STARTTLS for 587
        auth: {
          username: smtpUser,
          password: smtpPassword,
        },
      },
    });

    // Generate email content based on type
    let emailHtml = html;
    let emailText = text;

    if (type === 'welcome' && !html) {
      emailHtml = `
        <!DOCTYPE html>
        <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
              .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
              .button { display: inline-block; padding: 12px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
              .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>Welcome to Our Trading Platform!</h1>
              </div>
              <div class="content">
                <p>Thank you for joining our trading community. We're excited to have you on board!</p>
                <p>Start your trading journey with confidence using our advanced tools and features.</p>
                <a href="${Deno.env.get('SUPABASE_URL')}" class="button">Get Started</a>
                <p>If you have any questions, our support team is here to help.</p>
              </div>
              <div class="footer">
                <p>© 2024 Trading Platform. All rights reserved.</p>
              </div>
            </div>
          </body>
        </html>
      `;
      emailText = text || "Welcome to our Trading Platform! Thank you for joining our community.";
    }

    if (type === 'verification' && !html) {
      emailHtml = `
        <!DOCTYPE html>
        <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: #4CAF50; color: white; padding: 20px; text-align: center; border-radius: 10px 10px 0 0; }
              .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
              .code { background: #333; color: #4CAF50; padding: 15px; font-size: 24px; text-align: center; border-radius: 5px; margin: 20px 0; font-family: monospace; }
              .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>Email Verification Required</h1>
              </div>
              <div class="content">
                <p>Please verify your email address to activate your account.</p>
                <p>Click the link below or use the verification code provided:</p>
                <div class="code">VERIFY-${Math.random().toString(36).substring(2, 8).toUpperCase()}</div>
                <p>This code will expire in 24 hours.</p>
              </div>
              <div class="footer">
                <p>© 2024 Trading Platform. All rights reserved.</p>
              </div>
            </div>
          </body>
        </html>
      `;
      emailText = text || "Please verify your email address to activate your account.";
    }

    // Send email
    await client.send({
      from: smtpUser,
      to: to,
      subject: subject,
      content: emailText || "",
      html: emailHtml || undefined,
    });

    console.log(`Email sent successfully to ${to} with subject: ${subject}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Email sent successfully",
        recipient: to 
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error sending email:", error);
    return new Response(
      JSON.stringify({ 
        error: "Failed to send email", 
        details: error.message 
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);