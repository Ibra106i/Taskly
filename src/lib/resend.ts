import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendWelcomeEmail(email: string, name: string) {
  await resend.emails.send({
    from: "Taskly <onboarding@resend.dev>",
    to: email,
    subject: "Welcome to Taskly!",
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: 'DM Sans', sans-serif; background-color: #F7F5F0; color: #131d25; margin: 0; padding: 40px; }
            .container { max-width: 480px; margin: 0 auto; background: white; border-radius: 24px; padding: 48px; box-shadow: 0 12px 32px rgba(113, 121, 118, 0.08); }
            h1 { color: #45645e; font-size: 32px; font-weight: 700; margin-bottom: 8px; }
            p { color: #414846; font-size: 16px; line-height: 24px; }
            .button { display: inline-block; background-color: #84a59d; color: white; padding: 12px 32px; border-radius: 9999px; text-decoration: none; font-weight: 600; margin-top: 24px; }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>Welcome to Taskly!</h1>
            <p>Hi ${name},</p>
            <p>Thanks for signing up. Taskly helps you stay focused and organized with a simple, beautiful todo list.</p>
            <p>Start by adding your first todo!</p>
            <a href="${process.env.NEXT_PUBLIC_SUPABASE_URL?.replace('.supabase.co', '.vercel.app') || 'http://localhost:3000'}" class="button">Open Taskly</a>
            <p style="margin-top: 32px; color: #717976; font-size: 14px;">— The Taskly Team</p>
          </div>
        </body>
      </html>
    `,
  });
}

export async function sendPasswordResetEmail(email: string, resetUrl: string) {
  await resend.emails.send({
    from: "Taskly <onboarding@resend.dev>",
    to: email,
    subject: "Reset your Taskly password",
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: 'DM Sans', sans-serif; background-color: #F7F5F0; color: #131d25; margin: 0; padding: 40px; }
            .container { max-width: 480px; margin: 0 auto; background: white; border-radius: 24px; padding: 48px; box-shadow: 0 12px 32px rgba(113, 121, 118, 0.08); }
            h1 { color: #45645e; font-size: 24px; font-weight: 700; margin-bottom: 8px; }
            p { color: #414846; font-size: 16px; line-height: 24px; }
            .button { display: inline-block; background-color: #84a59d; color: white; padding: 12px 32px; border-radius: 9999px; text-decoration: none; font-weight: 600; margin-top: 24px; }
            .warning { background-color: #ffdad6; border-radius: 12px; padding: 16px; margin-top: 24px; }
            .warning p { color: #93000a; font-size: 14px; margin: 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>Reset your password</h1>
            <p>We received a request to reset your Taskly password.</p>
            <a href="${resetUrl}" class="button">Reset Password</a>
            <div class="warning">
              <p>This link expires in 1 hour. If you didn't request this, you can safely ignore this email.</p>
            </div>
            <p style="margin-top: 32px; color: #717976; font-size: 14px;">— The Taskly Team</p>
          </div>
        </body>
      </html>
    `,
  });
}

export async function sendTodoReminderEmail(
  email: string,
  name: string,
  pendingTodos: { title: string; created_at: string }[]
) {
  const todoList = pendingTodos
    .map(
      (todo) =>
        `<li style="padding: 8px 0; border-bottom: 1px solid #e5effb;">${todo.title}</li>`
    )
    .join("");

  await resend.emails.send({
    from: "Taskly <onboarding@resend.dev>",
    to: email,
    subject: `You have ${pendingTodos.length} pending todo${pendingTodos.length > 1 ? "s" : ""}`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: 'DM Sans', sans-serif; background-color: #F7F5F0; color: #131d25; margin: 0; padding: 40px; }
            .container { max-width: 480px; margin: 0 auto; background: white; border-radius: 24px; padding: 48px; box-shadow: 0 12px 32px rgba(113, 121, 118, 0.08); }
            h1 { color: #45645e; font-size: 24px; font-weight: 700; margin-bottom: 8px; }
            p { color: #414846; font-size: 16px; line-height: 24px; }
            ul { list-style: none; padding: 0; margin: 24px 0; }
            .button { display: inline-block; background-color: #84a59d; color: white; padding: 12px 32px; border-radius: 9999px; text-decoration: none; font-weight: 600; margin-top: 24px; }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>Don't forget your todos!</h1>
            <p>Hi ${name},</p>
            <p>You have ${pendingTodos.length} pending todo${pendingTodos.length > 1 ? "s" : ""} waiting for you:</p>
            <ul>${todoList}</ul>
            <a href="${process.env.NEXT_PUBLIC_SUPABASE_URL?.replace('.supabase.co', '.vercel.app') || 'http://localhost:3000'}" class="button">Open Taskly</a>
            <p style="margin-top: 32px; color: #717976; font-size: 14px;">— The Taskly Team</p>
          </div>
        </body>
      </html>
    `,
  });
}
