import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: users } = await supabase.auth.admin.listUsers();
  if (!users?.users) return NextResponse.json({ ok: true, sent: 0 });

  let sent = 0;
  const now = new Date();
  const weekAgo = new Date(now);
  weekAgo.setDate(weekAgo.getDate() - 7);

  for (const user of users.users) {
    const email = user.email;
    if (!email) continue;

    const { data: todos } = await supabase
      .from("todos")
      .select("title, completed, due_date, created_at")
      .eq("user_id", user.id);

    if (!todos || todos.length === 0) continue;

    const completedWeek = todos.filter(
      (t) => t.completed && new Date(t.created_at) >= weekAgo
    ).length;
    const totalCompleted = todos.filter((t) => t.completed).length;
    const pendingTotal = todos.filter((t) => !t.completed).length;
    const overdueTasks = todos
      .filter(
        (t) => !t.completed && t.due_date && new Date(t.due_date) < now
      )
      .map((t) => t.title);

    if (pendingTotal === 0 && completedWeek === 0) continue;

    try {
      await resend.emails.send({
        from: "TaskMax <onboarding@resend.dev>",
        to: email,
        subject: `Weekly Report — ${completedWeek} completed this week`,
        html: `
          <!DOCTYPE html>
          <html>
            <head>
              <style>
                body { font-family: 'DM Sans', sans-serif; background-color: #F7F5F0; color: #131d25; margin: 0; padding: 40px; }
                .container { max-width: 480px; margin: 0 auto; background: white; border-radius: 24px; padding: 48px; box-shadow: 0 12px 32px rgba(113, 121, 118, 0.08); }
                h1 { color: #45645e; font-size: 24px; font-weight: 700; margin-bottom: 8px; }
                p { color: #414846; font-size: 16px; line-height: 24px; }
                .stat { display: inline-block; text-align: center; padding: 16px 24px; background: #f7f5f0; border-radius: 16px; margin: 4px; }
                .stat-num { font-size: 28px; font-weight: 700; color: #45645e; display: block; }
                .stat-label { font-size: 12px; color: #717976; text-transform: uppercase; letter-spacing: 0.5px; }
                .button { display: inline-block; background-color: #84a59d; color: white; padding: 12px 32px; border-radius: 9999px; text-decoration: none; font-weight: 600; margin-top: 24px; }
                .overdue { background: #ffdad6; border-radius: 12px; padding: 16px; margin: 16px 0; }
                .overdue p { color: #93000a; font-size: 14px; margin: 4px 0; }
              </style>
            </head>
            <body>
              <div class="container">
                <h1>Weekly Report</h1>
                <p>Here's your TaskMax summary for the past 7 days:</p>
                <div style="text-align: center; margin: 24px 0;">
                  <div class="stat"><span class="stat-num">${completedWeek}</span><span class="stat-label">Done this week</span></div>
                  <div class="stat"><span class="stat-num">${totalCompleted}</span><span class="stat-label">All time</span></div>
                  <div class="stat"><span class="stat-num">${pendingTotal}</span><span class="stat-label">Pending</span></div>
                </div>
                ${overdueTasks.length > 0 ? `<div class="overdue"><p style="font-weight:600; margin-bottom:8px;">Overdue tasks</p>${overdueTasks.map((t) => `<p>${t}</p>`).join("")}</div>` : ""}
                <a href="${process.env.NEXT_PUBLIC_SUPABASE_URL?.replace('.supabase.co', '.vercel.app') || 'http://localhost:3000'}" class="button">Open TaskMax</a>
              </div>
            </body>
          </html>
        `,
      });
      sent++;
    } catch (e) {
      console.error(`Failed to send weekly report to ${email}:`, e);
    }
  }

  return NextResponse.json({ ok: true, sent });
}
