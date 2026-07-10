import { NextRequest, NextResponse } from "next/server";
import { isUnroutableTestDomain } from "@/lib/notifications/testDomain";

export const dynamic = "force-dynamic";

const BASE = process.env.NEXT_PUBLIC_APP_URL || "https://silverconnect-global.vercel.app";

function html(title: string, body: string, cta?: string, label?: string): string {
  let s = "<!DOCTYPE html><html><body style=\"font-family:sans-serif;background:#f8faf9;padding:20px\">";
  s += "<div style=\"max-width:480px;margin:0 auto;background:white;border-radius:16px;overflow:hidden\">";
  s += "<div style=\"background:#065f46;padding:24px;text-align:center\"><h1 style=\"color:white;margin:0\">SilverConnect</h1></div>";
  s += "<div style=\"padding:32px 24px\"><h2>" + title + "</h2><div style=\"font-size:18px;line-height:1.6\">" + body + "</div>";
  if (cta) s += "<div style=\"text-align:center;margin:32px 0\"><a href=\"" + cta + "\" style=\"background:#059669;color:white;padding:16px 32px;border-radius:12px;text-decoration:none;font-size:20px;font-weight:bold;display:inline-block\">" + (label || "View") + "</a></div>";
  s += "</div></div></body></html>";
  return s;
}

export async function POST(req: NextRequest) {
  const { to, type, data: d } = await req.json();
  if (!to || !type) return NextResponse.json({ error: "to and type required" }, { status: 400 });

  let subject = ""; let body = "";
  switch (type) {
    case "booking_confirmed":
      subject = "Booking Confirmed"; body = html("Confirmed!", "<p>Hi " + (d?.name || "") + ", your booking is confirmed for " + (d?.time || "") + ".</p>", BASE + "/en/bookings/" + (d?.bookingId || ""), "View Booking"); break;
    case "service_started":
      subject = "Helper Arrived!"; body = html("Started", "<p>" + (d?.providerName || "Helper") + " has arrived.</p>", BASE + "/en/bookings/" + (d?.bookingId || ""), "Track"); break;
    case "service_completed":
      subject = "Service Complete"; body = html("Complete!", "<p>Please leave a review.</p>", BASE + "/en/bookings/" + (d?.bookingId || "") + "/review", "Review"); break;
    case "payment_released":
      subject = "Payment: " + (d?.amount || ""); body = html("Released!", "<p>Payment of " + (d?.amount || "") + " on the way.</p>", BASE + "/en/provider/earnings", "Earnings"); break;
    case "reminder":
      subject = "Service Tomorrow"; body = html("Reminder", "<p>Your service is scheduled for tomorrow.</p>", BASE + "/en/bookings/" + (d?.bookingId || ""), "View"); break;
      case 'xinyuzhe_provider_registered':
        subject = '新心语者申请 — ' + (d?.name || '未知');
        body = html(
          '新心语者申请',
          '<p>姓名： <b>' + (d?.name||'') + '</b></p>' + '<p>手机： ' + (d?.phone||'') + '</p>' + '<p>Email: ' + (d?.email||'') + '</p>' + '<p>城市： ' + (d?.city||'—') + '</p>' + '<p>服务类型： ' + (d?.serviceTypes?.join('，')||'—') + '</p>' + '<p>时间： ' + new Date().toLocaleString('zh-CN') + '</p>',
          BASE + '/zh/admin/xinyuzhe', '审核申请'
        ); break;
      case 'xinyuzhe_registration_confirmed':
        subject = '感谢您申请和润心语者';
        body = html(
          '申请已收到 🌸',
          '<p>亲爱的 ' + (d?.name||'') + '，</p>' + '<p>感谢申请<b>和润心语者</b>认证，3～5工作日内审核并通知。</p>' + '<p>申请编号： <b>' + (d?.refId||'') + '</b></p>',
          BASE + '/zh/xinyuzhe/training', '开始培训课程'
        ); break;
      case 'xinyuzhe_booking_admin':
        subject = '新心语者预约 — ' + (d?.name || '未知');
        body = html(
          '新预约请求',
          '<p>姓名： <b>' + (d?.name||'') + '</b></p>' + '<p>Email: ' + (d?.email||'') + '</p>' + '<p>手机： ' + (d?.phone||'—') + '</p>' + '<p>服务： ' + (d?.service||'xinyuzhe') + '</p>' + '<p>希望日期： ' + (d?.date||'未指定') + '</p>' + '<p>留言： ' + (d?.message||'—') + '</p>' + '<p>编号： <b>' + (d?.ref||'') + '</b></p>',
          BASE + '/zh/admin/xinyuzhe', '查看预约'
        ); break;
      case 'xinyuzhe_booking_confirmed':
        subject = '您的和润心语者预约已接收';
        body = html(
          '预约已接收 🌸',
          '<p>亲爱的 ' + (d?.name||'') + '，</p>' + '<p>您的心灵陪伴服务预约已接收，我们将尽快为您安排合适的心语者。</p>' + '<p>预约编号： <b>' + (d?.ref||'') + '</b></p>' + '<p>希望服务日期： ' + (d?.date||'未指定') + '</p>',
          BASE + '/zh/xinyuzhe/book', '修改预约'
        ); break;
      case 'xinyuzhe_provider_approved':
        subject = '恭喜！您已通过和润心语者审核';
        body = html(
          '审核通过 🎉',
          '<p>亲爱的 ' + (d?.name||'') + '，</p>' + '<p>恭喜您正式成为<b>和润心语者</b>认证服务者！您现在可以登录服务者中心开始接单。</p>',
          BASE + '/zh/xinyuzhe/hub', '进入服务者中心'
        ); break;
      case 'xinyuzhe_provider_rejected':
        subject = '和润心语者申请结果通知';
        body = html(
          '申请结果',
          '<p>亲爱的 ' + (d?.name||'') + '，</p>' + '<p>感谢您申请和润心语者认证服务者。经过审核，暂时无法批准您的申请。</p>' + '<p>您可在完善资料后重新提交申请。</p>',
          BASE + '/zh/xinyuzhe/registration', '重新申请'
        ); break;
    default: return NextResponse.json({ error: "Unknown: " + type }, { status: 400 });
  }

  if (isUnroutableTestDomain(to)) {
    console.log("[email] skipped -- unroutable test domain", subject, "->", to);
    return NextResponse.json({ success: true, sent: false, reason: "test-domain-skipped" });
  }

  if (process.env.SMTP_USER) {
    const nm = (await import("nodemailer")).default;
    const t = nm.createTransport({ host: process.env.SMTP_HOST || "smtp.ethereal.email", port: Number(process.env.SMTP_PORT || 587), auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS || "" } });
    await t.sendMail({ from: process.env.EMAIL_FROM || "SilverConnect <hello@silverconnect.app>", to, subject, html: body });
    return NextResponse.json({ success: true, sent: true });
  }
  console.log("[email]", subject, "->", to);
  return NextResponse.json({ success: true, sent: false, reason: "SMTP not configured" });
}
