export type QualificationId =
  | 'cert3_individual_support' | 'cert3_allied_health'
  | 'cert4_disability'         | 'cert4_ageing'
  | 'diploma_community'
  | 'enrolled_nurse'           | 'registered_nurse'
  | 'allied_physio'            | 'allied_ot'
  | 'allied_speech'            | 'allied_podiatry'
  | 'personal_care_worker'

export type SchemeId =
  | 'ndis' | 'mac_hcp' | 'chsp' | 'dva' | 'tac'
  | 'worksafe' | 'icare' | 'comcare'
  | 'ltci_cn' | 'bmi_cn' | 'civil_cn' | 'disability_cn' | 'elderly_cn'

export interface Qualification {
  id: QualificationId
  label: string
  code: string
  streams?: string[]
  level: 'entry' | 'advanced' | 'diploma' | 'degree'
  ahpra: boolean
  ahpraCategory?: string
  assoc?: string
  requiredDocs: string[]
  description: string
}

export interface RequiredCheck {
  id: string
  label: string
  sublabel: string
  expiry: boolean
  renewalYears?: number
  mandatory: boolean
  link?: string
}

export interface GovScheme {
  id: SchemeId
  country: 'AU' | 'CN'
  label: string
  labelZh: string
  description: string
  forGroup: string
  platformFeeNote: string
  registrationLink?: string
}

export const QUALIFICATIONS: Qualification[] = [
  {
    id: 'cert3_individual_support',
    label: 'Certificate III in Individual Support',
    code: 'CHC33021',
    streams: ['Aged Care', 'Disability', 'Home & Community'],
    level: 'entry', ahpra: false,
    requiredDocs: ['certificate', 'transcript'],
    description: 'Standard entry-level support worker. Most common for NDIS and aged care roles.',
  },
  {
    id: 'cert3_allied_health',
    label: 'Certificate III in Allied Health Assistance',
    code: 'HLT33221',
    streams: ['Therapy Support'],
    level: 'entry', ahpra: false,
    requiredDocs: ['certificate', 'transcript'],
    description: 'Assists physiotherapists, OTs and other allied health professionals in therapy delivery.',
  },
  {
    id: 'cert4_disability',
    label: 'Certificate IV in Disability Support',
    code: 'CHC43121',
    streams: ['Disability'],
    level: 'advanced', ahpra: false,
    requiredDocs: ['certificate', 'transcript'],
    description: 'Advanced disability support. Qualifies for higher-complexity NDIS supports and team lead roles.',
  },
  {
    id: 'cert4_ageing',
    label: 'Certificate IV in Ageing Support',
    code: 'CHC43015',
    streams: ['Aged Care'],
    level: 'advanced', ahpra: false,
    requiredDocs: ['certificate', 'transcript'],
    description: 'Senior aged care qualification. Required for supervisory and team leader roles in aged care.',
  },
  {
    id: 'diploma_community',
    label: 'Diploma of Community Services',
    code: 'CHC52021',
    streams: ['Disability', 'Community Services'],
    level: 'diploma', ahpra: false,
    requiredDocs: ['certificate', 'transcript'],
    description: 'Case management and complex disability coordination. Pathway to Support Coordinator (NDIS).',
  },
  {
    id: 'enrolled_nurse',
    label: 'Enrolled Nurse (EN)',
    code: 'HLT54121',
    streams: ['Nursing'],
    level: 'diploma', ahpra: true, ahpraCategory: 'Nursing',
    requiredDocs: ['certificate', 'ahpra_cert', 'indemnity_insurance'],
    description: 'AHPRA registered EN. Can administer medications under supervision, wound care, clinical assessments.',
  },
  {
    id: 'registered_nurse',
    label: 'Registered Nurse (RN)',
    code: 'Bachelor of Nursing',
    streams: ['Nursing'],
    level: 'degree', ahpra: true, ahpraCategory: 'Nursing',
    requiredDocs: ['degree_cert', 'ahpra_cert', 'indemnity_insurance'],
    description: 'AHPRA registered RN. Full clinical scope. Complex care management, medication management, NDIS Specialist Support.',
  },
  {
    id: 'allied_physio',
    label: 'Physiotherapist',
    code: 'Bachelor of Physiotherapy',
    streams: ['Allied Health'],
    level: 'degree', ahpra: true, ahpraCategory: 'Physiotherapy',
    requiredDocs: ['degree_cert', 'ahpra_cert', 'indemnity_insurance'],
    description: 'AHPRA registered. Mobility assessment, rehabilitation programs, falls prevention for seniors.',
  },
  {
    id: 'allied_ot',
    label: 'Occupational Therapist (OT)',
    code: 'Bachelor of Occupational Therapy',
    streams: ['Allied Health'],
    level: 'degree', ahpra: true, ahpraCategory: 'Occupational Therapy',
    requiredDocs: ['degree_cert', 'ahpra_cert', 'indemnity_insurance'],
    description: 'AHPRA registered OT. Home modifications, daily living assessments, adaptive equipment prescription.',
  },
  {
    id: 'allied_speech',
    label: 'Speech Pathologist',
    code: 'Bachelor of Speech Pathology',
    streams: ['Allied Health'],
    level: 'degree', ahpra: false, assoc: 'Speech Pathology Australia (SPA)',
    requiredDocs: ['degree_cert', 'spa_membership', 'indemnity_insurance'],
    description: 'SPA certified. Communication and language support, dysphagia (swallowing) assessment and therapy.',
  },
  {
    id: 'allied_podiatry',
    label: 'Podiatrist',
    code: 'Bachelor of Podiatric Medicine',
    streams: ['Allied Health'],
    level: 'degree', ahpra: true, ahpraCategory: 'Podiatry',
    requiredDocs: ['degree_cert', 'ahpra_cert', 'indemnity_insurance'],
    description: 'AHPRA registered. Foot and lower limb care, wound management, diabetes foot checks.',
  },
  {
    id: 'personal_care_worker',
    label: 'Personal Care Worker (no formal cert required)',
    code: 'PCW',
    streams: ['Personal Care'],
    level: 'entry', ahpra: false,
    requiredDocs: ['id_document', 'ndis_orientation_cert'],
    description: 'No formal certificate required. Must complete NDIS Worker Orientation Module (free, ~90 min). Enrolling in Cert III is strongly recommended.',
  },
]

export const REQUIRED_CHECKS: RequiredCheck[] = [
  {
    id: 'ndis_screening',
    label: 'NDIS Worker Screening Check',
    sublabel: 'Mandatory for all risk-assessed roles. 5-year validity. Apply via your state/territory.',
    expiry: true, renewalYears: 5, mandatory: true,
    link: 'https://www.ndiscommission.gov.au/workers/worker-screening',
  },
  {
    id: 'police_check',
    label: 'National Police Check',
    sublabel: 'Must be issued within the last 3 years. Apply through Australian Criminal Intelligence Commission.',
    expiry: true, renewalYears: 3, mandatory: true,
    link: 'https://www.acic.gov.au/national-police-checks/individuals',
  },
  {
    id: 'wwvp',
    label: 'Working With Vulnerable People (WWVP) Check',
    sublabel: 'State-issued. Required for most support roles. Expiry varies by state (typically 3-5 years).',
    expiry: true, renewalYears: 5, mandatory: true,
  },
  {
    id: 'ndis_orientation',
    label: 'NDIS Worker Orientation Module',
    sublabel: 'Free online course ~90 min. Covers NDIS Code of Conduct. Certificate of completion required.',
    expiry: false, mandatory: true,
    link: 'https://training.ndiscommission.gov.au',
  },
  {
    id: 'first_aid',
    label: 'First Aid Certificate (HLTAID011 — Provide First Aid)',
    sublabel: '3-year renewal. Includes CPR update. Must be from a registered training organisation.',
    expiry: true, renewalYears: 3, mandatory: true,
  },
  {
    id: 'cpr',
    label: 'CPR Certificate (HLTAID009 — Provide CPR)',
    sublabel: 'Annual renewal required. Can be done concurrently with First Aid renewal.',
    expiry: true, renewalYears: 1, mandatory: true,
  },
  {
    id: 'drivers_licence',
    label: "Driver's Licence + Comprehensive Vehicle Insurance",
    sublabel: 'Required if transporting clients in your own vehicle.',
    expiry: true, renewalYears: 5, mandatory: false,
  },
  {
    id: 'public_liability',
    label: 'Public Liability Insurance ($10M minimum)',
    sublabel: 'Required for registered NDIS providers and most government scheme providers.',
    expiry: true, renewalYears: 1, mandatory: false,
  },
  {
    id: 'prof_indemnity',
    label: 'Professional Indemnity Insurance ($2M minimum)',
    sublabel: 'Mandatory for all allied health and nursing professionals.',
    expiry: true, renewalYears: 1, mandatory: false,
  },
]

export const GOV_SCHEMES: GovScheme[] = [
  // ── Australia ──────────────────────────────────────────────────────────
  {
    id: 'ndis',
    country: 'AU',
    label: 'NDIS — National Disability Insurance Scheme',
    labelZh: 'NDIS — 国家残障保险计划',
    description: "Australia's national scheme for people with permanent and significant disability under 65. Hourly support rates set by NDIS Price Guide (e.g. Support Worker $59.81/hr, RN $131.67/hr, OT $193.99/hr). Providers can be registered (audit required) or unregistered (self-managed/plan-managed participants only).",
    forGroup: 'Disability (any age) — participants with an approved NDIS plan',
    platformFeeNote: '5% SilverConnect management fee on claimed supports',
    registrationLink: 'https://www.ndiscommission.gov.au/providers/registered-ndis-providers',
  },
  {
    id: 'mac_hcp',
    country: 'AU',
    label: 'My Aged Care / Home Care Packages (HCP Level 1–4)',
    labelZh: 'My Aged Care / 家庭护理套餐 L1–4',
    description: 'Commonwealth-funded packages for older Australians. Level 1 ($10,271/yr basic needs) through Level 4 ($59,593/yr high-care needs). Accessed via ACAT/RAS assessment through My Aged Care. Provider must be an approved home care provider.',
    forGroup: 'Seniors 65+ (or 50+ for Aboriginal/Torres Strait Islander). ACAT-assessed.',
    platformFeeNote: '15% care management + 5% case management from HCP package. Zero out-of-pocket for client.',
    registrationLink: 'https://www.myagedcare.gov.au/providers/home-care-providers',
  },
  {
    id: 'chsp',
    country: 'AU',
    label: 'CHSP — Commonwealth Home Support Programme',
    labelZh: 'CHSP — 联邦家庭支持计划',
    description: 'Entry-level home support for seniors who need help to remain at home. Lower intensity than HCP. Services include domestic assistance, personal care, social support, transport, meals, and allied health.',
    forGroup: 'Seniors 65+ needing basic domestic, personal, or social support assessed by RAS',
    platformFeeNote: '8% platform fee. Small client co-contribution applies. Government funds most costs.',
    registrationLink: 'https://www.health.gov.au/our-work/chsp',
  },
  {
    id: 'dva',
    country: 'AU',
    label: 'DVA — Department of Veterans’ Affairs',
    labelZh: 'DVA — 退伍军人事务部',
    description: 'Funded care for Australian veterans and dependants. Gold card holders: full coverage. White card: service-related injuries. Orange card: specific conditions. Covers home and community care, nursing, allied health, and residential aged care.',
    forGroup: 'Veterans and dependants with Gold, White or Orange DVA card',
    platformFeeNote: 'DVA schedule rates + 8% SilverConnect coordination fee',
    registrationLink: 'https://www.dva.gov.au/providers/becoming-dva-provider',
  },
  {
    id: 'tac',
    country: 'AU',
    label: 'TAC — Transport Accident Commission (VIC)',
    labelZh: 'TAC — 维州交通意外赔偿',
    description: 'Victorian government scheme covering attendant care, nursing, and allied health after road accidents. Provider must sign a TAC service agreement. TAC sets service rates.',
    forGroup: 'People injured in road accidents in Victoria — TAC-funded support',
    platformFeeNote: 'TAC schedule rates + 10% SilverConnect coordination fee',
    registrationLink: 'https://www.tac.vic.gov.au/providers',
  },
  {
    id: 'worksafe',
    country: 'AU',
    label: 'WorkSafe VIC / SafeWork NSW / WorkCover QLD',
    labelZh: 'WorkSafe / 工伤保险',
    description: 'State workers compensation schemes funding attendant care and allied health after workplace injuries. Provider must be approved under the relevant state scheme.',
    forGroup: 'Workers injured on the job — state-based approved providers',
    platformFeeNote: 'State schedule rates + 10% SilverConnect coordination fee',
    registrationLink: 'https://www.worksafe.vic.gov.au/providers',
  },
  {
    id: 'icare',
    country: 'AU',
    label: 'iCare — NSW Workers Compensation',
    labelZh: 'iCare — 新州工伤保险',
    description: 'NSW workers compensation funding attendant care, nursing, and allied health after workplace injury. Register as an iCare-approved provider.',
    forGroup: 'NSW workers injured at work',
    platformFeeNote: 'iCare schedule rates + 10% SilverConnect coordination fee',
    registrationLink: 'https://www.icare.nsw.gov.au/providers',
  },
  {
    id: 'comcare',
    country: 'AU',
    label: 'Comcare — Commonwealth Workers Compensation',
    labelZh: 'Comcare — 联邦工伤保险',
    description: 'Covers Australian Commonwealth and ACT public service workers injured on the job. Register as a Comcare-approved attendant care or allied health provider.',
    forGroup: 'Commonwealth and ACT government workers injured at work',
    platformFeeNote: 'Comcare schedule rates + 10% SilverConnect coordination fee',
    registrationLink: 'https://www.comcare.gov.au/providers',
  },
  // ── China (CN) ────────────────────────────────────────────────────────
  {
    id: 'ltci_cn',
    country: 'CN',
    label: '长期护理险 (Long-term Care Insurance)',
    labelZh: '长期护理险',
    description: '政府主导的长期护理保险，为重度失能人员提供护理服务，目前已在49个城市试点（包括上海、青岛、成都等）。大多数地区每天最高补偿1200小时/年的居家或机构护理费用。 (Government long-term care insurance. 49 pilot cities including Shanghai, Qingdao, Chengdu. Covers up to 1,200 hrs/yr.)',
    forGroup: '重度失能人员（Barthel评分≤ 40），试点城市中参加居民基本医保的人员',
    platformFeeNote: '政府报销已批准服务费用。8% 平台协调费',
    registrationLink: 'https://www.nhc.gov.cn',
  },
  {
    id: 'bmi_cn',
    country: 'CN',
    label: '基本医疗保险 (Basic Medical Insurance)',
    labelZh: '基本医疗保险',
    description: '国家基本医疗保险，覆盖门诊及住院护理费用。城镇居民基本医疗保险（城居医保）和新型农村合作医疗（新农合作医疗）均可申请。 (National basic medical insurance. Covers nursing and medical care.)',
    forGroup: '城镇居民医保和新农合医准参保人员',
    platformFeeNote: '政府共付模式。平台费 8%',
    registrationLink: 'https://www.nhsa.gov.cn',
  },
  {
    id: 'civil_cn',
    country: 'CN',
    label: '民政救助 (Civil Affairs Welfare)',
    labelZh: '民政救助',
    description: '政府民政救助，面向低收入老年人、残疾人和困难群体。包括最低生活保障（低保）、特困人员特别救助金等。 (Government welfare for low-income elderly and disabled. Includes minimum livelihood guarantee.)',
    forGroup: '低保老年人、已登记残疾人和困难群体',
    platformFeeNote: '政府直接补贴服务提供方。5% 协调费',
    registrationLink: 'https://www.mca.gov.cn',
  },
  {
    id: 'disability_cn',
    country: 'CN',
    label: '残疾人補贴 (Disability Supplement)',
    labelZh: '残疾人補贴',
    description: '政府对持有残疾证（一至四级）人员发放的月度補贴，包括困难残疾人生活補贴和重度残疾人护理補贴。 (Monthly supplement for registered disabled persons Grade 1-4.)',
    forGroup: '持有残疾证（一至四级）残疾人',
    platformFeeNote: '客户使用補贴金支付服务。无平台附加费',
  },
  {
    id: 'elderly_cn',
    country: 'CN',
    label: '高龄津贴 / 居家养老補贴 (Old Age Allowance)',
    labelZh: '高龄津贴 / 居家养老補贴',
    description: '80岁以上高龄津贴，以及各省居家养老服务補贴项目。各地标准不同，通常按户籍申请。 (Monthly allowance for seniors 80+. Provincial home care subsidies. Varies by province.)',
    forGroup: '80岁以上正常户籍老年人——各省标准不同',
    platformFeeNote: '客户使用津贴支付服务。无平台附加费',
  },
]

// ─ NDIS Registration Paths (unregistered sole trader → registered provider) ─────

export interface NdisRegistrationPath {
  id:            'sole_trader' | 'registered_provider'
  label:         string
  labelZh:       string
  description:   string
  canServe:      string[]
  prerequisites: string[]
  auditRequired: boolean
  auditTypes?:   { type: string; forUse: string; costRange: string }[]
  timeToStart:   string
  costEstimate:  string
  officialLink:  string
  practicalTip:  string
}

export const NDIS_REGISTRATION_PATHS: NdisRegistrationPath[] = [
  {
    id:          'sole_trader',
    label:       'Unregistered Sole Trader (ABN) — Recommended starting point',
    labelZh:     '未注册个体经营者 · 推荐起步路径',
    description: 'Operate with an ABN. Serve self-managed and plan-managed NDIS participants immediately. No audit required. Fastest, lowest-cost path to earning income.',
    canServe:    ['Self-managed NDIS participants', 'Plan-managed NDIS participants'],
    prerequisites: [
      'ABN — register free at abr.business.gov.au',
      'Public liability insurance (min $10M) + professional indemnity ($2M recommended)',
      'NDIS Worker Screening Check (state-issued, ~$115, 5-year validity)',
      'National Police Check (within 3 years)',
      'Working with Vulnerable People (WWVP) / Working with Children Check (state-issued)',
      'NDIS Worker Orientation Module (free, ~90 min — training.ndiscommission.gov.au)',
      'First Aid HLTAID011 (3-year) + CPR HLTAID009 (annual renewal)',
      'Service Agreement template for each participant',
      'Cancellation policy aligned with NDIS Pricing Arrangements',
      'Incident reporting, complaints and safeguarding policies',
    ],
    auditRequired: false,
    timeToStart:   '2–4 weeks',
    costEstimate:  'ABN: free · Insurance: ~$500–$2,000/yr · Screening: ~$115 · First Aid: ~$150',
    officialLink:  'https://www.ndiscommission.gov.au/workers',
    practicalTip:  '⭐ Start here. Accumulate clients + cash flow first, then assess NDIS Provider Registration (audit $2k–$15k).',
  },
  {
    id:          'registered_provider',
    label:       'NDIS Registered Provider',
    labelZh:     'NDIS 注册服务提供者',
    description: 'Register with the NDIS Quality and Safeguards Commission. Unlocks NDIA-managed clients (~30% of all NDIS participants) and higher-risk support categories.',
    canServe:    [
      'All NDIS participants — including NDIA-managed',
      'Higher-risk supports (behaviour support, SIL, specialist support coordination)',
    ],
    prerequisites: [
      'All unregistered sole trader requirements (above)',
      'myGovID (Standard or Strong identity strength)',
      'Registration groups and classes of support selected',
      'Key personnel: name, DOB, role, qualifications for each person',
      'All risk-assessed workers have NDIS Worker Screening Clearance',
      'Quality management system + policies & procedures documented',
      'Incident management + reportable incidents procedure',
      'Complaints management procedure',
      'Emergency and disaster management plan',
      'Apply via NDIS Commission Portal (my.ndiscommission.gov.au)',
      'Engage NDIS-approved independent auditor (ndiscommission.gov.au/approved-auditors)',
    ],
    auditRequired: true,
    auditTypes: [
      { type: 'Verification audit',  forUse: 'Lower-risk supports (daily activities, transport, domestic, community)', costRange: '$2,000–$5,000' },
      { type: 'Certification audit', forUse: 'Higher-risk / complex (behaviour support, SIL, specialist support)', costRange: '$5,000–$15,000+' },
    ],
    timeToStart:   '3–6 months',
    costEstimate:  'All sole trader costs + audit: $2,000–$15,000 + annual compliance + renewal audit every 3 years',
    officialLink:  'https://www.ndiscommission.gov.au/providers/registered-ndis-providers/new-provider-registration',
    practicalTip:  'Recommended once client base is stable. Unlocks NDIA-managed clients + higher billing tiers. Behaviour support / SIL require certification audit.',
  },
]

export const STATE_SCREENING_LINKS: Record<string, { label: string; url: string }> = {
  VIC: { label: 'Service Victoria NDIS Worker Screening Check',   url: 'https://service.vic.gov.au/services/ndis-worker-screening-check' },
  NSW: { label: 'Service NSW NDIS Worker Screening Check',        url: 'https://www.service.nsw.gov.au/transaction/apply-for-a-ndis-worker-screening-check' },
  QLD: { label: 'NDIS Worker Screening QLD (Blue Card Services)', url: 'https://www.qld.gov.au/community/caring-child-youth-families/blue-card-system' },
  WA:  { label: 'NDIS Worker Screening WA',                      url: 'https://www.ndischeck.commerce.wa.gov.au' },
  SA:  { label: 'DHS NDIS Worker Screening SA',                  url: 'https://www.dhs.sa.gov.au/services/community-services/ndis-worker-screening-check' },
  TAS: { label: 'NDIS Worker Screening Tasmania',                url: 'https://www.justice.tas.gov.au/registration' },
  NT:  { label: 'NDIS Worker Screening NT',                      url: 'https://nt.gov.au/law/rights/apply-for-ndis-worker-screening' },
  ACT: { label: 'Access Canberra NDIS Worker Screening',         url: 'https://www.accesscanberra.act.gov.au' },
}

export const QUALIFICATION_NOTES = {
  cert3Warning:   'Cert III in Individual Support is the standard NDIS support worker entry qualification. IMPORTANT: this does NOT authorise clinical nursing. Do not advertise nursing/clinical services unless you hold AHPRA registration.',
  cert4Advice:    'Cert IV in Disability Support → complex NDIS supports + team lead. Cert IV in Ageing Support → My Aged Care (HCP/CHSP). Either Cert IV increases billing tier and credibility.',
  ahpraNote:      'Clinical services (medication management, wound care, nursing assessments) require AHPRA registration. Non-AHPRA providers offering clinical services risk compliance action under NDIS/Aged Care quality standards.',
  ndisWorkerNote: 'No formal certificate required to START as NDIS support worker. Minimum: NDIS Worker Orientation Module (free, ~90 min) + Worker Screening Check. Cert III is strongly recommended.',
}
