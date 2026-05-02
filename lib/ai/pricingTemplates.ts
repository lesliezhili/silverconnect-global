export type AiLanguage = 'en' | 'zh-Hans' | 'zh-Hant' | 'ja' | 'ko' | 'th' | 'vi'
export type CountryCode = 'AU' | 'CA' | 'US' | 'CN'

export interface PricingExplanationInput {
  country_code: CountryCode
  is_weekend: boolean
  is_holiday: boolean
  time_of_day: 'morning' | 'afternoon' | 'evening' | 'night'
  language: AiLanguage
  service_type: string
  customer_total?: number
}

const SERVICE_NAMES: Record<string, Record<AiLanguage, string>> = {
  cleaning: { 'en': 'home cleaning', 'zh-Hans': '家庭清洁', 'zh-Hant': '家庭清潔', 'ja': 'ハウスクリーニング', 'ko': '홈 클리닝', 'th': 'ทำความสะอาดบ้าน', 'vi': 'dịch vụ dọn nhà' },
  cooking: { 'en': 'cooking', 'zh-Hans': '烹饪', 'zh-Hant': '烹飪', 'ja': '料理', 'ko': '요리', 'th': 'ทำอาหาร', 'vi': 'nấu ăn' },
  gardening: { 'en': 'gardening', 'zh-Hans': '园艺', 'zh-Hant': '園藝', 'ja': '庭仕事', 'ko': '정원 관리', 'th': 'ทำสวน', 'vi': 'làm vườn' },
  personal: { 'en': 'personal care', 'zh-Hans': '个人护理', 'zh-Hant': '個人護理', 'ja': 'パーソナルケア', 'ko': '개인 케어', 'th': 'ดูแลส่วนตัว', 'vi': 'chăm sóc cá nhân' },
  maintenance: { 'en': 'maintenance', 'zh-Hans': '维修', 'zh-Hant': '維修', 'ja': 'メンテナンス', 'ko': '정비', 'th': 'บำรุงรักษา', 'vi': 'bảo trì' },
}

const COUNTRY_LABELS: Record<CountryCode, Record<AiLanguage, string>> = {
  AU: { 'en': 'Australia', 'zh-Hans': '澳大利亚', 'zh-Hant': '澳大利亞', 'ja': 'オーストラリア', 'ko': '호주', 'th': 'ออสเตรเลีย', 'vi': 'Úc' },
  CA: { 'en': 'Canada', 'zh-Hans': '加拿大', 'zh-Hant': '加拿大', 'ja': 'カナダ', 'ko': '캐나다', 'th': 'แคนาดา', 'vi': 'Canada' },
  US: { 'en': 'the United States', 'zh-Hans': '美国', 'zh-Hant': '美國', 'ja': 'アメリカ', 'ko': '미국', 'th': 'สหรัฐอเมริกา', 'vi': 'Hoa Kỳ' },
  CN: { 'en': 'China', 'zh-Hans': '中国', 'zh-Hant': '中國', 'ja': '中国', 'ko': '중국', 'th': 'จีน', 'vi': 'Trung Quốc' },
}

const TEMPLATES: Record<AiLanguage, (params: PricingExplanationInput) => string> = {
  en: ({ country_code, is_weekend, is_holiday, time_of_day, service_type, customer_total }) => {
    const country = COUNTRY_LABELS[country_code].en
    const service = SERVICE_NAMES[service_type]?.en || service_type
    const explanations = []
    if (is_holiday) explanations.push(`This booking is on a public holiday in ${country}, so a holiday loading applies.`)
    if (is_weekend) explanations.push(`It is also on the weekend, applying the weekend premium.`)
    explanations.push(`The ${time_of_day} time slot uses the standard time-of-day rate multiplier.`)
    if (customer_total !== undefined) explanations.push(`Your estimated total is ${customer_total} in ${country_code} currency.`)
    return explanations.join(' ')
  },
  'zh-Hans': ({ country_code, is_weekend, is_holiday, time_of_day, service_type, customer_total }) => {
    const country = COUNTRY_LABELS[country_code]['zh-Hans']
    const service = SERVICE_NAMES[service_type]['zh-Hans'] || service_type
    const explanations = []
    if (is_holiday) explanations.push(`这次预约是 ${country} 的公共假期，因此适用假期加价。`)
    if (is_weekend) explanations.push(`同时它发生在周末，将应用周末加价。`)
    explanations.push(`${time_of_day} 时段使用标准时段倍率。`)
    if (customer_total !== undefined) explanations.push(`预计总费用为 ${customer_total} ${country_code}。`)
    return explanations.join(' ')
  },
  'zh-Hant': ({ country_code, is_weekend, is_holiday, time_of_day, service_type, customer_total }) => {
    const country = COUNTRY_LABELS[country_code]['zh-Hant']
    const explanations = []
    if (is_holiday) explanations.push(`這次預約是 ${country} 的公共假期，因此適用假期加價。`)
    if (is_weekend) explanations.push(`同時它發生在週末，將應用週末加價。`)
    explanations.push(`${time_of_day} 時段使用標準時段倍率。`)
    if (customer_total !== undefined) explanations.push(`預計總費用為 ${customer_total} ${country_code}。`)
    return explanations.join(' ')
  },
  ja: ({ country_code, is_weekend, is_holiday, time_of_day, customer_total }) => {
    const country = COUNTRY_LABELS[country_code].ja
    const explanations = []
    if (is_holiday) explanations.push(`${country} の祝日なので、祝日料金が適用されます。`)
    if (is_weekend) explanations.push(`週末にも当たるため、週末料金が上乗せされます。`)
    explanations.push(`${time_of_day} の時間帯は標準の時間帯倍率が適用されます。`)
    if (customer_total !== undefined) explanations.push(`概算合計は ${customer_total} ${country_code} です。`)
    return explanations.join(' ')
  },
  ko: ({ country_code, is_weekend, is_holiday, time_of_day, customer_total }) => {
    const country = COUNTRY_LABELS[country_code].ko
    const explanations = []
    if (is_holiday) explanations.push(`${country}의 공휴일이어서 공휴일 할증이 적용됩니다.`)
    if (is_weekend) explanations.push(`주말에도 해당하므로 주말 할증이 추가됩니다.`)
    explanations.push(`${time_of_day} 시간대는 표준 시간대 배수가 적용됩니다.`)
    if (customer_total !== undefined) explanations.push(`예상 총액은 ${customer_total} ${country_code} 입니다.`)
    return explanations.join(' ')
  },
  th: ({ country_code, is_weekend, is_holiday, time_of_day, customer_total }) => {
    const country = COUNTRY_LABELS[country_code].th
    const explanations = []
    if (is_holiday) explanations.push(`การจองนี้อยู่ในวันหยุดราชการของ ${country} จึงมีค่าโหลดพิเศษวันหยุด`)
    if (is_weekend) explanations.push(`และเป็นวันหยุดสุดสัปดาห์ จึงมีค่าโหลดวันหยุดสุดสัปดาห์`)
    explanations.push(`ช่วงเวลา ${time_of_day} ใช้อัตราตัวคูณเวลาปกติ`)
    if (customer_total !== undefined) explanations.push(`รวมเบื้องต้น ${customer_total} ${country_code}`)
    return explanations.join(' ')
  },
  vi: ({ country_code, is_weekend, is_holiday, time_of_day, customer_total }) => {
    const country = COUNTRY_LABELS[country_code].vi
    const explanations = []
    if (is_holiday) explanations.push(`Lịch hẹn này rơi vào ngày lễ ở ${country}, nên áp dụng phụ phí ngày lễ.`)
    if (is_weekend) explanations.push(`Nó cũng nằm vào cuối tuần, vì vậy phụ phí cuối tuần sẽ được áp dụng.`)
    explanations.push(`Khung giờ ${time_of_day} sử dụng hệ số thời gian tiêu chuẩn.`)
    if (customer_total !== undefined) explanations.push(`Tổng dự kiến là ${customer_total} ${country_code}.`)
    return explanations.join(' ')
  }
}

export function generatePricingExplanation(input: PricingExplanationInput) {
  const language = input.language in TEMPLATES ? input.language : 'en'
  const fullExplanation = TEMPLATES[language](input)
  return {
    title: language === 'zh-Hans' ? '价格说明' : language === 'zh-Hant' ? '價格說明' : language === 'ja' ? '料金の説明' : language === 'ko' ? '요금 설명' : language === 'th' ? 'คำอธิบายราคา' : language === 'vi' ? 'Giải thích giá' : 'Pricing explanation',
    fullExplanation,
  }
}

export function getQuickEstimate(serviceType: string, countryCode: CountryCode = 'AU') {
  const country = COUNTRY_LABELS[countryCode]?.en || 'Australia'
  const typeText = SERVICE_NAMES[serviceType]?.en || serviceType
  return `A quick estimate for ${typeText} in ${country} is available once you pick a slot and provider.`
}
