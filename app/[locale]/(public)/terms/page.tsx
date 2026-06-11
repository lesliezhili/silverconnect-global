import { setRequestLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";

export default async function TermsPage({
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
        {isZh ? "服务条款" : "Terms & Conditions"}
      </h1>
      <p className="mt-2 text-[16px] text-text-secondary">
        {isZh ? "最后更新：2026年5月25日" : "Last updated: 25 May 2026"}
      </p>

      <div className="mt-8 flex flex-col gap-8 text-[18px] leading-relaxed text-text-primary">

        {/* 1. About SilverConnect */}
        <section>
          <h2 className="text-elder-subheading font-semibold">
            {isZh ? "1. 关于和润 SilverConnect" : "1. About SilverConnect"}
          </h2>
          <p className="mt-3">
            {isZh
              ? "和润 SilverConnect Global（\"平台\"）是一个非营利互助平台，连接需要居家服务的长者与经过验证的服务人员。平台由 SilverConnect Global Pty Ltd（ABN 待申请）运营，服务覆盖澳大利亚、中国、加拿大、美国、台湾、新加坡、香港和马来西亚。"
              : "SilverConnect Global (\"the Platform\") is a non-profit mutual aid platform connecting older adults who need home services with verified care providers. The Platform is operated by SilverConnect Global Pty Ltd (ABN pending) and serves Australia, China, Canada, United States, Taiwan, Singapore, Hong Kong, and Malaysia."}
          </p>
        </section>

        {/* 2. Eligibility */}
        <section>
          <h2 className="text-elder-subheading font-semibold">
            {isZh ? "2. 使用资格" : "2. Eligibility"}
          </h2>
          <ul className="mt-3 list-disc pl-6 flex flex-col gap-2">
            <li>{isZh ? "您必须年满18岁方可注册为服务人员" : "You must be at least 18 years old to register as a care provider"}</li>
            <li>{isZh ? "服务对象无年龄限制，但未成年人的账户需由监护人管理" : "There is no age restriction for service recipients, but accounts for minors must be managed by a guardian"}</li>
            <li>{isZh ? "您必须提供真实、准确的个人信息" : "You must provide truthful and accurate personal information"}</li>
            <li>{isZh ? "每人只能注册一个账户" : "Each person may only register one account"}</li>
          </ul>
        </section>

        {/* 3. Services */}
        <section>
          <h2 className="text-elder-subheading font-semibold">
            {isZh ? "3. 服务内容" : "3. Services"}
          </h2>
          <p className="mt-3">
            {isZh
              ? "平台提供以下六大类居家服务的预约匹配：清洁服务、花园户外、维修保养、个人护理、陪伴服务、交通接送。平台本身不直接提供上述服务，而是作为服务人员与客户之间的中介平台。"
              : "The Platform facilitates booking and matching for six categories of home services: Cleaning, Garden & Outdoor, Repairs, Personal Care, Companion, and Transport. The Platform does not directly provide these services but acts as an intermediary between care providers and customers."}
          </p>
        </section>

        {/* 4. Platform Fee */}
        <section>
          <h2 className="text-elder-subheading font-semibold">
            {isZh ? "4. 平台费用" : "4. Platform Fee"}
          </h2>
          <p className="mt-3">
            {isZh
              ? "平台收取15%的服务费（含GST/增值税），远低于行业平均的25-40%。服务人员获得85%的服务收入。费用在预约确认时明确显示，无隐藏费用。"
              : "The Platform charges a 15% service fee (inclusive of applicable GST/VAT), significantly below the industry average of 25-40%. Care providers receive 85% of the service revenue. Fees are clearly displayed at booking confirmation with no hidden charges."}
          </p>
        </section>

        {/* 5. Cancellation Policy */}
        <section>
          <h2 className="text-elder-subheading font-semibold">
            {isZh ? "5. 取消政策" : "5. Cancellation Policy"}
          </h2>
          <ul className="mt-3 list-disc pl-6 flex flex-col gap-2">
            <li>{isZh ? "预约开始前24小时以上取消：全额退款" : "Cancellation more than 24 hours before booking: full refund"}</li>
            <li>{isZh ? "预约开始前12-24小时取消：退款50%" : "Cancellation 12-24 hours before booking: 50% refund"}</li>
            <li>{isZh ? "预约开始前12小时内取消：不退款" : "Cancellation less than 12 hours before booking: no refund"}</li>
            <li>{isZh ? "服务人员未到：全额退款并优先重新安排" : "Provider no-show: full refund and priority rebooking"}</li>
          </ul>
        </section>

        {/* 6. Safety & Verification */}
        <section>
          <h2 className="text-elder-subheading font-semibold">
            {isZh ? "6. 安全与验证" : "6. Safety & Verification"}
          </h2>
          <p className="mt-3">
            {isZh
              ? "所有服务人员必须通过以下验证方可接单：警察背景审查（或当地等效）、身份证件验证、资格证书审核（如适用）、人脸识别确认。平台提供紧急求助按钮、GPS追踪（服务期间）、家庭监护仪表盘等安全功能。"
              : "All care providers must pass the following verification before accepting bookings: police background check (or local equivalent), identity document verification, qualification certificate review (where applicable), and facial recognition confirmation. The Platform provides emergency panic button, GPS tracking (during service), and family monitoring dashboard as safety features."}
          </p>
        </section>

        {/* 7. User Conduct */}
        <section>
          <h2 className="text-elder-subheading font-semibold">
            {isZh ? "7. 用户行为准则" : "7. User Conduct"}
          </h2>
          <p className="mt-3">{isZh ? "您同意不会：" : "You agree not to:"}</p>
          <ul className="mt-2 list-disc pl-6 flex flex-col gap-2">
            <li>{isZh ? "提供虚假信息或冒充他人" : "Provide false information or impersonate another person"}</li>
            <li>{isZh ? "骚扰、威胁或歧视任何用户" : "Harass, threaten, or discriminate against any user"}</li>
            <li>{isZh ? "绕过平台直接交易" : "Bypass the Platform to transact directly"}</li>
            <li>{isZh ? "使用平台从事任何非法活动" : "Use the Platform for any illegal activities"}</li>
            <li>{isZh ? "未经授权收集其他用户的个人信息" : "Collect personal information of other users without authorization"}</li>
          </ul>
        </section>

        {/* 8. Privacy */}
        <section>
          <h2 className="text-elder-subheading font-semibold">
            {isZh ? "8. 隐私保护" : "8. Privacy"}
          </h2>
          <p className="mt-3">
            {isZh
              ? "我们重视您的隐私。个人信息的收集、使用和保护详见我们的隐私政策。我们遵守澳大利亚隐私法(1988)、中国个人信息保护法(PIPL)、加拿大PIPEDA以及适用国家/地区的相关隐私法律。"
              : "We value your privacy. The collection, use, and protection of personal information is detailed in our Privacy Policy. We comply with the Australian Privacy Act (1988), China\'s Personal Information Protection Law (PIPL), Canada\'s PIPEDA, and applicable privacy laws in all operating jurisdictions."}
          </p>
          <Link
            href="/privacy-policy"
            className="mt-2 inline-flex text-brand font-semibold"
          >
            {isZh ? "查看隐私政策 →" : "View Privacy Policy →"}
          </Link>
        </section>

        {/* 9. Intellectual Property */}
        <section>
          <h2 className="text-elder-subheading font-semibold">
            {isZh ? "9. 知识产权" : "9. Intellectual Property"}
          </h2>
          <p className="mt-3">
            {isZh
              ? "SilverConnect 平台代码以 MIT 开源许可证发布。品牌标识、设计和商标归 SilverConnect Global Pty Ltd 所有。用户生成的内容（评价、照片等）您保留所有权，但授予平台展示和使用的许可。"
              : "The SilverConnect platform code is released under the MIT open-source license. Brand identity, design, and trademarks are owned by SilverConnect Global Pty Ltd. User-generated content (reviews, photos, etc.) remains your property, but you grant the Platform a license to display and use it."}
          </p>
        </section>

        {/* 10. Limitation of Liability */}
        <section>
          <h2 className="text-elder-subheading font-semibold">
            {isZh ? "10. 责任限制" : "10. Limitation of Liability"}
          </h2>
          <p className="mt-3">
            {isZh
              ? "平台作为中介，不对服务人员提供的服务质量做直接担保。在法律允许的最大范围内，平台对因服务产生的间接、特殊或后果性损失不承担责任。平台的最大赔偿责任不超过争议交易的平台费用部分。"
              : "As an intermediary, the Platform does not directly guarantee the quality of services provided by care providers. To the maximum extent permitted by law, the Platform is not liable for indirect, special, or consequential damages arising from services. The Platform\'s maximum liability shall not exceed the platform fee portion of the disputed transaction."}
          </p>
        </section>

        {/* 11. Dispute Resolution */}
        <section>
          <h2 className="text-elder-subheading font-semibold">
            {isZh ? "11. 争议解决" : "11. Dispute Resolution"}
          </h2>
          <ul className="mt-3 list-disc pl-6 flex flex-col gap-2">
            <li>{isZh ? "第一步：通过平台内争议系统提交投诉（48小时内响应）" : "Step 1: Submit a complaint through the in-app dispute system (response within 48 hours)"}</li>
            <li>{isZh ? "第二步：如不满意，可申请平台调解" : "Step 2: If unsatisfied, request Platform mediation"}</li>
            <li>{isZh ? "第三步：如调解失败，可提交至当地消费者保护机构或小额诉讼法院" : "Step 3: If mediation fails, submit to local consumer protection agency or small claims court"}</li>
          </ul>
        </section>

        {/* 12. Changes to Terms */}
        <section>
          <h2 className="text-elder-subheading font-semibold">
            {isZh ? "12. 条款变更" : "12. Changes to Terms"}
          </h2>
          <p className="mt-3">
            {isZh
              ? "我们可能会不时更新本条款。重大变更将通过电子邮件和应用内通知提前30天告知。继续使用平台即表示您接受更新后的条款。"
              : "We may update these Terms from time to time. Material changes will be communicated via email and in-app notification at least 30 days in advance. Continued use of the Platform constitutes acceptance of the updated Terms."}
          </p>
        </section>

        {/* 13. Contact */}
        <section>
          <h2 className="text-elder-subheading font-semibold">
            {isZh ? "13. 联系我们" : "13. Contact Us"}
          </h2>
          <p className="mt-3">
            {isZh ? "如有任何疑问，请联系：" : "If you have any questions, please contact:"}
          </p>
          <ul className="mt-2 flex flex-col gap-1">
            <li>📧 support@silverconnect.global</li>
            <li>{isZh ? "📍 澳大利亚珀斯" : "📍 Perth, Australia"}</li>
          </ul>
        </section>

        {/* Governing Law */}
        <section className="border-t border-border pt-6">
          <p className="text-[16px] text-text-secondary">
            {isZh
              ? "本条款受澳大利亚西澳大利亚州法律管辖。如各语言版本存在歧义，以英文版为准。"
              : "These Terms are governed by the laws of Western Australia, Australia. In case of any discrepancy between language versions, the English version shall prevail."}
          </p>
        </section>
      </div>
    </main>
  );
}
