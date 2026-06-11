# Multilingual & Elder-First Specification

## 1. Product Mandate

SilverConnect Global must function as an **Asia-Pacific Multilingual Elder Support Platform**: a multilingual AI-powered elder support ecosystem designed for dignity, simplicity, trust, and emotional warmth.

The platform must prioritize:

- elderly accessibility for seniors aged 65+
- multilingual communication across families, elders, and workers
- migrant worker, international student, overseas caregiver, and older worker usability
- low digital literacy support
- voice-first interaction
- family trust and culturally inclusive care coordination

The UI must feel warm, calm, simple, emotionally safe, family-friendly, and culturally inclusive. Avoid complex enterprise dashboards, tiny text, crowded screens, corporate styling, low-contrast gray UI, and typing-heavy workflows.

## 2. Required Languages

The platform must support these languages as first-class product languages:

| Language | Priority |
|---|---|
| English | Primary |
| Simplified Chinese | Mandatory |
| Traditional Chinese | Mandatory |
| Japanese | Mandatory |
| Korean | Mandatory |
| Thai | Mandatory |

The architecture must allow future addition of:

- Vietnamese
- Indonesian
- Filipino / Tagalog
- Hindi
- Malay

## 3. Internationalization Architecture

### 3.1 Frontend

The web application must use `next-intl` or `react-i18next`. The current Next.js implementation uses `next-intl`; future work must extend that architecture rather than reintroducing ad hoc string dictionaries.

If a Flutter client is added, it must use Flutter Intl.

### 3.2 Locale Behavior

Users must be able to:

- switch language instantly
- save language preference
- auto-detect locale on first visit
- keep language consistent across customer, worker, family, and admin-adjacent flows

### 3.3 Content Storage

Database and storage layers must support:

- UTF-8 everywhere
- multilingual metadata
- translated service categories
- translated service descriptions
- multilingual notifications
- translated AI summaries
- original-language preservation for auditability

Recommended data pattern for translatable domain content:

- stable domain key, such as `service.cleaning.standard`
- `locale`
- `title`
- `description`
- optional `plain_language_title`
- optional `elder_friendly_summary`
- `updated_by`
- `review_status`

## 4. AI Multilingual Support

The AI companion system must support:

| Capability | Requirement |
|---|---|
| Chat | Multilingual |
| Voice transcription | Multilingual |
| Voice synthesis | Multilingual |
| Translation | Automatic |
| Family summaries | Translated |
| Worker notes | Translated |
| Notifications | Localized |

Required example flow:

1. Thai worker speaks Thai.
2. AI transcribes and translates the note.
3. English-speaking family receives an English summary.
4. Chinese-speaking elder receives Chinese voice playback.
5. The original Thai source remains available for audit and dispute review.

## 5. Real-Time Translation Layer

The platform must include an **AI Translation Middleware** responsible for:

- chat translation
- service request translation
- voice note translation
- family communication translation
- AI summary localization
- notification localization
- preserving original text and translated text

Open source translation providers are preferred:

- LibreTranslate
- Argos Translate
- MarianMT
- NLLB models

Paid fallback providers may be used when quality, latency, or language coverage requires it:

- OpenAI translation
- DeepL API

The middleware must expose a provider-neutral interface so translation providers can be swapped by locale, cost, availability, or quality score.

## 6. Elder-First UX Requirements

SilverConnect is not a standard marketplace UI. It must be optimized for:

- seniors aged 65+
- low digital literacy
- vision impairment
- cognitive fatigue
- multilingual households

### 6.1 Elder Accessibility Mode

The platform must provide an elder accessibility mode with:

- Large Text Mode: 150%, 200%, and 300% scaling
- large touch targets
- high contrast mode
- strong icon clarity
- dark text on warm light backgrounds
- high visibility primary actions
- friendly rounded typography and generous line spacing

Avoid:

- thin fonts
- low contrast gray UI
- small text
- dense dashboards
- complicated navigation

### 6.2 Grandparent Mode

The platform must include **Grandparent Mode**, a simplified UI mode with:

- minimal screens
- one primary action per screen
- voice-first navigation
- persistent help button
- large icons
- large spacing
- simplified wording
- no unnecessary dashboards

## 7. Voice-First Experience

Voice interaction is a critical requirement because many elderly users type slowly, cannot read comfortably, or prefer speaking.

The platform must support voice interaction everywhere practical, including:

- "Book cleaning tomorrow"
- "Call my daughter"
- "I need grocery help"
- "Tell my worker I will be home at 3"

Required voice features:

| Feature | Required |
|---|---|
| Speech-to-text | Yes |
| Text-to-speech | Yes |
| Voice navigation | Yes |
| Voice reminders | Yes |
| Multi-language voices | Yes |
| Slow speech mode | Yes |

Preferred open source voice stack:

| Need | OSS Tool |
|---|---|
| STT | Whisper |
| TTS | Piper |
| Realtime voice | LiveKit |
| Voice routing | VAD + LangChain |

## 8. Elder Safety UX

The platform must include a persistent emergency action with a large, high-visibility red button for:

- call family
- call emergency contact
- request help
- reach local emergency services where appropriate

The wellness check-in interface must be simple and no-typing:

- Good
- Okay
- Need Help

The UI may use expressive faces or icons as long as labels remain readable and accessible.

## 9. Multicultural UX

The platform must support Asian family structures, multigenerational households, and culturally respectful communication.

Required cultural features:

- family-name-first naming conventions
- multilingual names
- preferred spoken name
- pronunciation hints where useful
- timezone-aware family updates
- culturally respectful notification wording

Matching should optionally consider:

- language
- cultural background
- cooking familiarity
- religious sensitivity
- communication style

## 10. Service Provider Experience

Many providers may be migrants, international students, older workers, or low-tech users. The worker experience must support **Worker Simple Mode**.

Worker Simple Mode must include:

- checklist workflow
- voice upload instead of typing
- photo-first task completion
- auto-translated messages
- navigation assistance
- clear status labels
- large buttons

Required worker flow:

1. Accept job.
2. Navigate to home.
3. Take before photo.
4. Complete cleaning or care task.
5. Take after photo.
6. Record voice summary.
7. AI auto-generates report.
8. Family receives translated update.

## 11. Family Portal Multi-Language Support

Family members may live overseas and speak different languages from the elder or worker.

The family portal must support:

- multilingual notifications
- timezone-aware updates
- translated summaries
- concise AI-generated updates
- original source note access when appropriate

Required example:

- Japanese daughter receives Japanese summaries.
- Chinese elder hears Mandarin voice playback.
- Thai worker speaks Thai voice notes.
- All updates synchronize through AI translation middleware.

## 12. Required Design System

The design system must include reusable components for elder-first and multilingual workflows:

- `ElderButton`
- `VoiceInputButton`
- `LargeCard`
- `EmergencyActionCard`
- `SimplifiedNavigation`
- `FamilyStatusCard`
- `ServiceTimelineCard`

Accessibility target:

- WCAG AA minimum
- elder usability optimized beyond baseline WCAG
- large touch targets across all primary workflows
- readable text under 150%, 200%, and 300% scaling

## 13. Required Testing

Testing strategy must include:

- multilingual E2E tests
- accessibility tests
- large-font responsive tests
- voice workflow tests
- low-tech usability tests
- locale persistence tests
- translation middleware contract tests
- worker photo and voice summary flow tests
- family translated-notification tests

## 14. MVP Priorities

Phase 1 must include:

| Area | Required |
|---|---|
| Elder features | Large font mode, voice booking, multilingual UI, simplified navigation |
| Worker features | Multilingual onboarding, translated messaging, voice summaries, photo workflow |
| Family features | Translated notifications, AI summaries, trust dashboard |

## 15. Mandatory Execution Instruction

Every product, design, engineering, AI, and QA task must comply with this mandate:

**Multilingual & Elder-First Mandate**

The platform must prioritize elderly accessibility, multilingual communication, migrant worker usability, low digital literacy support, and voice-first interaction.

Mandatory languages:

- English
- Simplified Chinese
- Traditional Chinese
- Japanese
- Korean
- Thai

Mandatory accessibility features:

- large text mode
- voice navigation
- simplified UI mode
- high contrast mode
- large touch targets
- multilingual voice support

Optimize for:

- seniors aged 65+
- migrants
- low-tech users
- family trust
- multilingual communication
- emotional reassurance

