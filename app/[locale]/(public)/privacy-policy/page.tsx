import { setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";

export default async function PrivacyPolicyPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const isZh = locale === "zh" || locale === "zh_tw";

  return (
    <main
      id="main-content"
      className="mx-auto w-full max-w-content px-6 pb-20 pt-8"
    >
      <Link
        href="/"
        className="mb-6 inline-flex items-center text-brand font-semibold"
      >
        ← {isZh ? "返回首页" : "Back to Home"}
      </Link>

      <h1 className="text-elder-heading font-bold text-text-primary">
        {isZh ? "隐私政策" : "Privacy Policy"}
      </h1>
      <p className="mt-2 text-[16px] text-text-secondary">
        {isZh ? "最后更新：2026年5月25日" : "Last updated: 25 May 2026"}
      </p>

      <div className="mt-8 flex flex-col gap-8 text-[18px] leading-relaxed text-text-primary">

        <section>
          <h2 className="text-elder-subheading font-semibold">
            {isZh ? "我们收集的信息" : "Information We Collect"}
          </h2>
          <ul className="mt-3 list-disc pl-6 flex flex-col gap-2">
            <li>{isZh ? "账户信息：姓名、电子邮件、电话号码、地址" : "Account information: name, email, phone number, address"}</li>
            <li>{isZh ? "身份验证：政府颁发的身份证件（服务人员）" : "Identity verification: government-issued ID (care providers)"}</li>
            <li>{isZh ? "服务数据：预约历史、评价、偏好设置" : "Service data: booking history, reviews, preferences"}</li>
            <li>{isZh ? "位置数据：仅在服务期间（GPS追踪用于安全）" : "Location data: only during active service (GPS tracking for safety)"}</li>
            <li>{isZh ? "支付信息：通过第三方支付处理商（我们不存储卡号）" : "Payment information: via third-party payment processor (we do not store card numbers)"}</li>
            <li>{isZh ? "设备信息：设备类型、操作系统、浏览器版本" : "Device information: device type, operating system, browser version"}</li>
          </ul>
        </section>

        <section>
          <h2 className="text-elder-subheading font-semibold">
            {isZh ? "信息使用方式" : "How We Use Information"}
          </h2>
          <ul className="mt-3 list-disc pl-6 flex flex-col gap-2">
            <li>{isZh ? "匹配您与合适的服务人员" : "Match you with suitable care providers"}</li>
            <li>{isZh ? "处理预约和付款" : "Process bookings and payments"}</li>
            <li>{isZh ? "确保平台安全（身份验证、欺诈检测）" : "Ensure platform safety (identity verification, fraud detection)"}</li>
            <li>{isZh ? "发送预约提醒和重要通知" : "Send booking reminders and important notifications"}</li>
            <li>{isZh ? "改善服务质量和用户体验" : "Improve service quality and user experience"}</li>
            <li>{isZh ? "遵守法律义务" : "Comply with legal obligations"}</li>
          </ul>
        </section>

        <section>
          <h2 className="text-elder-subheading font-semibold">
            {isZh ? "信息共享" : "Information Sharing"}
          </h2>
          <p className="mt-3">
            {isZh
              ? "我们不会出售您的个人信息。仅在以下情况分享："
              : "We do not sell your personal information. We only share it in the following circumstances:"}
          </p>
          <ul className="mt-2 list-disc pl-6 flex flex-col gap-2">
            <li>{isZh ? "与您匹配的服务人员/客户（仅必要的联系信息）" : "With matched care providers/customers (only necessary contact information)"}</li>
            <li>{isZh ? "支付处理商（处理交易）" : "Payment processors (to process transactions)"}</li>
            <li>{isZh ? "法律要求（法院命令、政府机构要求）" : "Legal requirements (court orders, government agency requests)"}</li>
            <li>{isZh ? "紧急情况（保护生命安全）" : "Emergency situations (to protect life safety)"}</li>
          </ul>
        </section>

        <section>
          <h2 className="text-elder-subheading font-semibold">
            {isZh ? "数据保护" : "Data Protection"}
          </h2>
          <ul className="mt-3 list-disc pl-6 flex flex-col gap-2">
            <li>{isZh ? "所有数据传输使用 TLS 1.3 加密" : "All data transmissions encrypted with TLS 1.3"}</li>
            <li>{isZh ? "数据存储使用 AES-256 加密" : "Data at rest encrypted with AES-256"}</li>
            <li>{isZh ? "定期安全审计和渗透测试" : "Regular security audits and penetration testing"}</li>
            <li>{isZh ? "最小权限原则——员工仅访问工作所需数据" : "Principle of least privilege — staff only access data needed for their role"}</li>
            <li>{isZh ? "数据存储在所服务国家/地区的合规数据中心" : "Data stored in compliant data centers within operating jurisdictions"}</li>
          </ul>
        </section>

        <section>
          <h2 className="text-elder-subheading font-semibold">
            {isZh ? "您的权利" : "Your Rights"}
          </h2>
          <ul className="mt-3 list-disc pl-6 flex flex-col gap-2">
            <li>{isZh ? "访问：查看我们持有的您的所有数据" : "Access: view all data we hold about you"}</li>
            <li>{isZh ? "更正：更新不正确的信息" : "Correction: update incorrect information"}</li>
            <li>{isZh ? "删除：要求删除您的账户和数据" : "Deletion: request deletion of your account and data"}</li>
            <li>{isZh ? "导出：下载您的数据副本" : "Portability: download a copy of your data"}</li>
            <li>{isZh ? "撤回同意：随时停止营销通信" : "Withdraw consent: opt out of marketing communications at any time"}</li>
          </ul>
          <p className="mt-3">
            {isZh
              ? "要行使以上权利，请通过应用内设置或发送邮件至 privacy@silverconnect.global"
              : "To exercise these rights, use in-app settings or email privacy@silverconnect.global"}
          </p>
        </section>

        <section>
          <h2 className="text-elder-subheading font-semibold">
            {isZh ? "数据保留" : "Data Retention"}
          </h2>
          <p className="mt-3">
            {isZh
              ? "活跃账户数据在账户存续期间保留。账户删除后，个人身份信息在30天内删除。财务记录按法律要求保留7年。匿名化的统计数据可能无限期保留。"
              : "Active account data is retained for the duration of the account. After account deletion, personally identifiable information is deleted within 30 days. Financial records are retained for 7 years as required by law. Anonymized statistical data may be retained indefinitely."}
          </p>
        </section>

        <section className="border-t border-border pt-6">
          <p className="text-[16px] text-text-secondary">
            {isZh
              ? "如对隐私有任何疑问，请联系 privacy@silverconnect.global"
              : "For any privacy-related questions, contact privacy@silverconnect.global"}
          </p>
        </section>
      </div>
    </main>
  );
}
