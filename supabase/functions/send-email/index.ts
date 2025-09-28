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
  console.log('Edge function invoked:', req.method, req.url);
  
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    console.log('Request received:', JSON.stringify(body));
    
    const { to, subject, html, text, type = 'generic' }: EmailRequest = body;

    // Validate required fields
    if (!to || !subject || (!html && !text)) {
      console.error('Missing required fields');
      return new Response(
        JSON.stringify({ error: "Missing required fields: to, subject, and either html or text" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Get SMTP configuration from environment variables
    const smtpHost = Deno.env.get("SMTP_HOST") || "smtp.mailer91.com";
    const smtpPort = parseInt(Deno.env.get("SMTP_PORT") || "587");
    const smtpUser = Deno.env.get("SMTP_USER") || "emailer@5p1v83.mailer91.com";
    const smtpPassword = Deno.env.get("SMTP_PASSWORD") || "j6w6bdif7ptxgok";

    console.log('SMTP Configuration:', {
      host: smtpHost,
      port: smtpPort,
      user: smtpUser,
      passwordLength: smtpPassword?.length
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
                <h1>Welcome to InvestX Pro!</h1>
              </div>
              <div class="content">
                <p>Thank you for joining our trading community. We're excited to have you on board!</p>
                <p>Start your trading journey with confidence using our advanced tools and features.</p>
                <p>If you have any questions, our support team is here to help.</p>
              </div>
              <div class="footer">
                <p>© 2024 InvestX Pro. All rights reserved.</p>
              </div>
            </div>
          </body>
        </html>
      `;
      emailText = text || "Welcome to InvestX Pro! Thank you for joining our community.";
    }

    if (type === 'verification' && !html) {
      emailHtml = html || `
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
                <p>Your verification code is:</p>
                <div class="code">VERIFY-CODE</div>
                <p>This code will expire in 24 hours.</p>
              </div>
              <div class="footer">
                <p>© 2024 InvestX Pro. All rights reserved.</p>
              </div>
            </div>
          </body>
        </html>
      `;
      emailText = text || "Please verify your email address to activate your account.";
    }

    console.log('Creating SMTP client...');
    
    try {
      // Create SMTP client with proper Mailer91 configuration
      const client = new SMTPClient({
        connection: {
          hostname: smtpHost,
          port: smtpPort,
          tls: false, // Mailer91 uses STARTTLS
          auth: {
            username: smtpUser,
            password: smtpPassword,
          },
        },
      });

      console.log('Sending email to:', to);
      
      // Send email
      await client.send({
        from: smtpUser,
        to: to,
        subject: subject,
        content: emailText || "",
        html: emailHtml || undefined,
      });
      
      console.log(`Email sent successfully to ${to}`);
      
      // Close the connection
      await client.close();

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
    } catch (smtpError: any) {
      console.error("SMTP Error:", smtpError);
      console.error("SMTP Error Stack:", smtpError.stack);
      
      // Return more detailed error for debugging
      return new Response(
        JSON.stringify({ 
          error: "Failed to send email via SMTP", 
          details: smtpError.message,
          code: smtpError.code,
          host: smtpHost,
          port: smtpPort,
          user: smtpUser
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }
  } catch (error: any) {
    console.error("General error in send-email function:", error);
    console.error("Error stack:", error.stack);
    
    return new Response(
      JSON.stringify({ 
        error: "Failed to process email request", 
        details: error.message,
        stack: error.stack 
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);