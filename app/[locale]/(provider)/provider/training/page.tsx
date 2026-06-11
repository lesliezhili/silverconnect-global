import { setRequestLocale, getTranslations } from "next-intl/server";
import { Header } from "@/components/layout/Header";
import { Link } from "@/i18n/navigation";
import { getCountry } from "@/components/domain/countryCookie";
import { getSession } from "@/components/domain/sessionCookie";

const TAFE_COURSES = [
  {
    code: "CHC33021",
    title: "Certificate III in Individual Support (Ageing)",
    titleZh: "三级个人支持证书（老年护理）",
    provider: "TAFE NSW / TAFE QLD / South Metro TAFE WA",
    duration: "6-12 months",
    durationZh: "6-12个月",
    mode: "Online + Placement",
    modeZh: "在线+实习",
    funding: "Fee-Free TAFE (eligible students)",
    fundingZh: "免费TAFE（符合条件的学生）",
    desc: "Foundation qualification for aged care workers. Covers personal care, mobility, nutrition, communication with elderly clients.",
    descZh: "老年护理工作者的基础资格。涵盖个人护理、行动辅助、营养、与长者沟通。",
    url: "https://www.tafensw.edu.au/course/CHC33021",
    emoji: "🎓",
  },
  {
    code: "CHC43015",
    title: "Certificate IV in Ageing Support",
    titleZh: "四级老年支持证书",
    provider: "TAFE SA / Melbourne Polytechnic / TAFE WA",
    duration: "12-18 months",
    durationZh: "12-18个月",
    mode: "Blended (Online + Face-to-face)",
    modeZh: "混合（在线+面授）",
    funding: "VET Student Loans / Fee-Free TAFE",
    fundingZh: "VET学生贷款 / 免费TAFE",
    desc: "Advanced qualification for team leaders and coordinators in aged care. Includes care planning, falls prevention, dementia support.",
    descZh: "老年护理团队领导和协调员的高级资格。包括护理计划、跌倒预防、失智症支持。",
    url: "https://www.tafensw.edu.au/course/CHC43015",
    emoji: "📋",
  },
  {
    code: "CHC43415",
    title: "Certificate IV in Leisure and Health",
    titleZh: "四级休闲与健康证书",
    provider: "TAFE NSW / Holmesglen / Chisholm TAFE",
    duration: "12 months",
    durationZh: "12个月",
    mode: "Online + Practical",
    modeZh: "在线+实操",
    funding: "Fee-Free TAFE (eligible)",
    fundingZh: "免费TAFE（符合条件）",
    desc: "Specialise in recreational activities, social programs, and wellbeing support for older adults in community and residential settings.",
    descZh: "专注于老年人的休闲活动、社交项目和社区/住宅环境中的健康支持。",
    url: "https://www.tafensw.edu.au/course/CHC43415",
    emoji: "🎨",
  },
  {
    code: "HLT23221",
    title: "Certificate II in Health Support Services",
    titleZh: "二级健康支持服务证书",
    provider: "All State TAFEs",
    duration: "3-6 months",
    durationZh: "3-6个月",
    mode: "Online + Placement",
    modeZh: "在线+实习",
    funding: "Fee-Free TAFE / JobTrainer",
    fundingZh: "免费TAFE / JobTrainer",
    desc: "Entry-level pathway into health and aged care. Perfect starting point for companion and transport service providers.",
    descZh: "健康和老年护理的入门级路径。非常适合陪伴和交通服务提供者的起点。",
    url: "https://www.tafensw.edu.au/course/HLT23221",
    emoji: "❤️",
  },
  {
    code: "HLTAID011",
    title: "Provide First Aid (1-day course)",
    titleZh: "急救证书（1天课程）",
    provider: "TAFE / St John Ambulance / Red Cross",
    duration: "1 day",
    durationZh: "1天",
    mode: "Face-to-face",
    modeZh: "面授",
    funding: "Self-funded ($150-200)",
    fundingZh: "自费（$150-200）",
    desc: "Essential first aid certification required for all personal care and companion providers. Valid for 3 years.",
    descZh: "所有个人护理和陪伴服务提供者必须持有的急救认证。有效期3年。",
    url: "https://www.stjohnwa.com.au/first-aid-training",
    emoji: "🏥",
  },
  {
    code: "CHCDEM001",
    title: "Dementia Support Short Course",
    titleZh: "失智症支持短期课程",
    provider: "Dementia Australia / TAFE",
    duration: "2-4 weeks",
    durationZh: "2-4周",
    mode: "Online",
    modeZh: "在线",
    funding: "Free (Dementia Australia) / Low-cost TAFE",
    fundingZh: "免费（澳洲失智症协会）/ TAFE低费用",
    desc: "Understand dementia types, communication strategies, behaviour support, and person-centred care approaches.",
    descZh: "了解失智症类型、沟通策略、行为支持和以人为本的护理方法。",
    url: "https://www.dementia.org.au/information/for-health-professionals",
    emoji: "🧠",
  },
];

const INTL_EQUIVALENTS = [
  { country: "CA", title: "Personal Support Worker (PSW) Certificate", titleZh: "个人支持工作者（PSW）证书", provider: "Ontario Community Colleges", duration: "8 months" },
  { country: "US", title: "Certified Nursing Assistant (CNA)", titleZh: "注册护理助手（CNA）", provider: "Community Colleges / Red Cross", duration: "4-12 weeks" },
  { country: "SG", title: "WSQ Healthcare Support Certificate", titleZh: "WSQ医疗保健支持证书", provider: "SkillsFuture Singapore", duration: "6 months" },
  { country: "HK", title: "ERB Home Care Worker Certificate", titleZh: "ERB家居照顾员证书", provider: "Employees Retraining Board", duration: "3 months" },
  { country: "TW", title: "照顧服務員訓練 (Care Worker Training)", titleZh: "照顧服務員訓練", provider: "衛福部認可機構", duration: "90小時" },
  { country: "MY", title: "SKM Care Worker Certificate", titleZh: "SKM护理工作者证书", provider: "Jabatan Pembangunan Kemahiran", duration: "6 months" },
];

export default async function TrainingPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const country = await getCountry();
  const session = await getSession();
  const isZh = locale === "zh" || locale === "zh_tw";

  return (
    <>
      <Header
        country={country}
        back
        signedIn={session.signedIn}
        initials={session.initials}
      />
      <main className="mx-auto w-full max-w-content px-5 pb-[120px] pt-5 sm:pb-12">
        <h1 className="text-elder-heading font-bold text-text-primary">
          {isZh ? "📚 培训与认证" : "📚 Training & Certification"}
        </h1>
        <p className="mt-2 text-[17px] text-text-secondary">
          {isZh
            ? "提升您的技能，获得更多预约机会。以下课程获SilverConnect认可，完成后可获得平台认证徽章。"
            : "Boost your skills and get more bookings. Complete these recognised courses to earn certification badges on your profile."}
        </p>

        {/* TAFE Courses — Australia */}
        <section className="mt-8">
          <h2 className="text-elder-subheading font-semibold">
            {isZh ? "🇦🇺 澳大利亚 TAFE 课程" : "🇦🇺 Australian TAFE Courses"}
          </h2>
          <p className="mt-1 text-[16px] text-text-secondary">
            {isZh
              ? "TAFE 是澳大利亚国家职业教育体系，政府资助，行业认可。"
              : "TAFE is Australia\'s national vocational education system — government-funded, industry-recognised."}
          </p>

          <div className="mt-4 flex flex-col gap-4">
            {TAFE_COURSES.map((course) => (
              <article
                key={course.code}
                className="rounded-lg border border-border bg-bg-base p-5 shadow-card"
              >
                <div className="flex items-start gap-3">
                  <span className="text-2xl">{course.emoji}</span>
                  <div className="flex-1">
                    <h3 className="text-elder-body font-bold text-text-primary">
                      {isZh ? course.titleZh : course.title}
                    </h3>
                    <p className="mt-0.5 text-[15px] font-semibold text-brand">
                      {course.code}
                    </p>
                    <p className="mt-2 text-[16px] text-text-secondary">
                      {isZh ? course.descZh : course.desc}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-3 text-[15px]">
                      <span className="inline-flex items-center gap-1 rounded-pill bg-bg-surface px-3 py-1 font-medium">
                        ⏱ {isZh ? course.durationZh : course.duration}
                      </span>
                      <span className="inline-flex items-center gap-1 rounded-pill bg-bg-surface px-3 py-1 font-medium">
                        💻 {isZh ? course.modeZh : course.mode}
                      </span>
                      <span className="inline-flex items-center gap-1 rounded-pill bg-success-soft px-3 py-1 font-medium text-success">
                        💰 {isZh ? course.fundingZh : course.funding}
                      </span>
                    </div>
                    <p className="mt-2 text-[15px] text-text-tertiary">
                      {course.provider}
                    </p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>

        {/* International Equivalents */}
        <section className="mt-10">
          <h2 className="text-elder-subheading font-semibold">
            {isZh ? "🌏 其他国家等效资格" : "🌏 International Equivalents"}
          </h2>
          <p className="mt-1 text-[16px] text-text-secondary">
            {isZh
              ? "以下国家的等效资格同样获得SilverConnect认可："
              : "Equivalent qualifications from these countries are also recognised by SilverConnect:"}
          </p>
          <div className="mt-4 flex flex-col gap-3">
            {INTL_EQUIVALENTS.map((eq) => (
              <div
                key={eq.country}
                className="flex items-center gap-4 rounded-md border border-border bg-bg-base p-4"
              >
                <span className="text-xl font-bold text-text-primary">{eq.country}</span>
                <div className="flex-1">
                  <p className="text-[17px] font-semibold text-text-primary">
                    {isZh ? eq.titleZh : eq.title}
                  </p>
                  <p className="text-[15px] text-text-secondary">
                    {eq.provider} · {eq.duration}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="mt-10 rounded-lg border-2 border-brand bg-brand-primary-soft p-6 text-center">
          <h2 className="text-elder-body font-bold text-text-primary">
            {isZh ? "🎯 完成培训后" : "🎯 After Completing Training"}
          </h2>
          <p className="mt-2 text-[17px] text-text-secondary">
            {isZh
              ? "上传您的证书到个人资料 → 获得平台认证徽章 → 在搜索结果中优先展示 → 获得更高时薪"
              : "Upload your certificate to your profile → Earn a verified badge → Get priority in search results → Command higher hourly rates"}
          </p>
          <Link
            href="/provider/compliance"
            className="mt-4 inline-flex h-14 items-center justify-center rounded-md bg-brand px-8 text-[18px] font-bold text-white"
          >
            {isZh ? "上传我的证书" : "Upload My Certificate"}
          </Link>
        </section>
      </main>
    </>
  );
}
