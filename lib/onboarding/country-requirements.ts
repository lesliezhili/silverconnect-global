/**
 * Country-specific provider onboarding requirements
 * AU = Australia, NZ = New Zealand
 */

export type CountryCode = "AU" | "NZ" | "CN";

export interface OnboardingRequirement {
  id: string;
  label: string;
  description: string;
  required: boolean;
  documentType: string;
  validationRegex?: string;
}

export interface BankFormat {
  fields: { name: string; label: string; placeholder: string; maxLength: number; pattern?: string }[];
  example: string;
}

export interface OnboardingConfig {
  country: CountryCode;
  identityCheck: OnboardingRequirement[];
  workRights: OnboardingRequirement[];
  compliance: OnboardingRequirement[];
  bankFormat: BankFormat;
  taxRegistration: { label: string; prefix: string; format: string; example: string };
  emergencyContact: { required: boolean; label: string };
  insuranceRequired: boolean;
  trainingModules: string[];
}

export const AU_ONBOARDING: OnboardingConfig = {
  country: "AU",
  identityCheck: [
    { id: "au_police_check", label: "National Police Check", description: "Valid Australian Federal Police check (< 12 months)", required: true, documentType: "police_check" },
    { id: "au_wwc", label: "Working With Children Check", description: "State-issued WWC card or VIT registration", required: true, documentType: "wwc" },
    { id: "au_id", label: "Photo ID", description: "Australian driver licence or passport", required: true, documentType: "photo_id" },
  ],
  workRights: [
    { id: "au_work_rights", label: "Work Rights", description: "Australian citizen, PR, or valid work visa", required: true, documentType: "work_rights" },
    { id: "au_abn", label: "ABN (Australian Business Number)", description: "11-digit ABN for sole traders/contractors", required: false, documentType: "abn" },
  ],
  compliance: [
    { id: "au_insurance", label: "Public Liability Insurance", description: "Minimum $10M coverage", required: true, documentType: "insurance" },
    { id: "au_first_aid", label: "First Aid Certificate", description: "Current first aid + CPR (HLTAID011)", required: false, documentType: "first_aid" },
  ],
  bankFormat: {
    fields: [
      { name: "bsb", label: "BSB", placeholder: "000-000", maxLength: 7, pattern: "^\\d{3}-?\\d{3}$" },
      { name: "account_number", label: "Account Number", placeholder: "12345678", maxLength: 9 },
      { name: "account_name", label: "Account Name", placeholder: "Jane Smith", maxLength: 50 },
    ],
    example: "BSB: 062-000, Account: 12345678",
  },
  taxRegistration: { label: "ABN", prefix: "ABN", format: "XX XXX XXX XXX", example: "51 824 753 556" },
  emergencyContact: { required: true, label: "Emergency Contact" },
  insuranceRequired: true,
  trainingModules: ["Workplace Health & Safety", "Elder Care Basics", "Cultural Sensitivity", "Privacy & Confidentiality", "Manual Handling"],
};

export const NZ_ONBOARDING: OnboardingConfig = {
  country: "NZ",
  identityCheck: [
    { id: "nz_police_vet", label: "NZ Police Vetting", description: "Ministry of Justice criminal record check (< 12 months)", required: true, documentType: "police_vet" },
    { id: "nz_safety_check", label: "Safety Check (Children's Act)", description: "Required for working with vulnerable people", required: true, documentType: "safety_check" },
    { id: "nz_id", label: "Photo ID", description: "NZ driver licence or passport", required: true, documentType: "photo_id" },
  ],
  workRights: [
    { id: "nz_work_rights", label: "NZ Work Rights", description: "NZ citizen, resident, or valid work visa", required: true, documentType: "work_rights" },
    { id: "nz_nzbn", label: "NZBN (NZ Business Number)", description: "13-digit NZBN for registered businesses", required: false, documentType: "nzbn" },
    { id: "nz_ird", label: "IRD Number", description: "Inland Revenue Department number for tax", required: true, documentType: "ird_number" },
  ],
  compliance: [
    { id: "nz_insurance", label: "Public Liability Insurance", description: "Minimum NZ$2M coverage", required: true, documentType: "insurance" },
    { id: "nz_first_aid", label: "First Aid Certificate", description: "NZQA Unit Standard 6402 or equivalent", required: false, documentType: "first_aid" },
    { id: "nz_acc", label: "ACC Levy Registration", description: "Accident Compensation Corporation registration", required: true, documentType: "acc_registration" },
  ],
  bankFormat: {
    fields: [
      { name: "bank_code", label: "Bank", placeholder: "06", maxLength: 2, pattern: "^\\d{2}$" },
      { name: "branch_code", label: "Branch", placeholder: "0101", maxLength: 4, pattern: "^\\d{4}$" },
      { name: "account_number", label: "Account", placeholder: "0012345", maxLength: 7, pattern: "^\\d{7}$" },
      { name: "suffix", label: "Suffix", placeholder: "00", maxLength: 3, pattern: "^\\d{2,3}$" },
      { name: "account_name", label: "Account Name", placeholder: "Jane Smith", maxLength: 50 },
    ],
    example: "06-0101-0012345-00 (Bank-Branch-Account-Suffix)",
  },
  taxRegistration: { label: "IRD Number", prefix: "IRD", format: "XX-XXX-XXX or XXX-XXX-XXX", example: "12-345-678" },
  emergencyContact: { required: true, label: "Emergency Contact" },
  insuranceRequired: true,
  trainingModules: ["Health & Safety at Work Act 2015", "Elder Care Fundamentals", "Te Tiriti o Waitangi Awareness", "Privacy Act 2020", "Manual Handling & Ergonomics"],
};

export function getOnboardingConfig(country: CountryCode): OnboardingConfig {
  return country === "NZ" ? NZ_ONBOARDING : AU_ONBOARDING;
}

export const NZ_BANKS: Record<string, string> = {
  "01": "ANZ", "02": "BNZ", "03": "Westpac", "06": "ASB",
  "08": "Rabobank", "11": "HSBC", "12": "TSB", "15": "SBS Bank",
  "25": "Citibank", "30": "ICBC", "31": "Kiwibank", "38": "Heartland",
};

export const CN_ONBOARDING: OnboardingConfig = {
  country: "CN",
  identityCheck: [
    { id: "cn_id_card", label: "身份证 (Resident ID Card)", description: "Valid mainland China resident identity card", required: true, documentType: "identity" },
    { id: "cn_police_check", label: "无犯罪记录证明", description: "Certificate of No Criminal Record from local PSB", required: true, documentType: "police_check" },
  ],
  workRights: [
    { id: "cn_hukou", label: "户口本 / 居住证", description: "Household registration or residence permit for the service city", required: false, documentType: "work_rights" },
  ],
  compliance: [
    { id: "cn_health_cert", label: "健康证", description: "Valid health certificate (健康合格证明)", required: true, documentType: "first_aid" },
    { id: "cn_elder_care_cert", label: "养老护理员证", description: "National Elder Care Worker Certificate (recommended)", required: false, documentType: "first_aid" },
  ],
  bankFormat: {
    fields: [
      { name: "bank_name", label: "开户银行", placeholder: "中国工商银行", maxLength: 30 },
      { name: "card_number", label: "银行卡号", placeholder: "6222 0200 0000 0000 000", maxLength: 23 },
      { name: "account_name", label: "户名", placeholder: "张三", maxLength: 20 },
    ],
    example: "工商银行 6222020000000000000",
  },
  taxRegistration: { label: "统一社会信用代码", prefix: "", format: "XXXXXXXXXXXXXXXXXX", example: "91110000MA0XXXXXX0" },
  emergencyContact: { required: true, label: "紧急联系人" },
  insuranceRequired: false,
  trainingModules: ["居家安全", "老年护理基础", "急救知识", "隐私与保密", "职业道德"],
};
