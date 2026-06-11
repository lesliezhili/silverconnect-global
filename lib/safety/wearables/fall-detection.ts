/**
 * Fall Detection & Wearable Integration
 * 
 * Supported devices:
 * - Apple Watch (HealthKit + Fall Detection API)
 * - Fitbit/Google Pixel Watch (Web API)
 * - Samsung Galaxy Watch (Health Platform)
 * - Generic BLE accelerometer pendants (Web Bluetooth API)
 * 
 * 5-factor detection algorithm with confidence scoring
 * 3-stage escalation protocol
 */

export type DeviceType = 'apple_watch' | 'fitbit' | 'samsung' | 'ble_pendant' | 'phone';
export type FallSeverity = 'low' | 'medium' | 'high' | 'critical';
export type FallStatus = 'detected' | 'user_confirmed_ok' | 'escalated_family' | 'escalated_emergency' | 'resolved';
export type SensitivityLevel = 'low' | 'medium' | 'high';

export interface FallEvent {
  id: string;
  userId: string;
  deviceType: DeviceType;
  timestamp: Date;
  severity: FallSeverity;
  confidence: number; // 0-1
  location?: { lat: number; lng: number };
  impactMagnitude: number; // m/s²
  immobilityDuration: number; // seconds
  orientationChanged: boolean;
  heartRateSpike: boolean;
  preImpactMovement: boolean;
  status: FallStatus;
  responseTimeline: ResponseEvent[];
}

export interface ResponseEvent {
  timestamp: Date;
  action: string;
  actor: 'system' | 'user' | 'family' | 'emergency';
  result: string;
}

export interface SensorReading {
  accelerometer: { x: number; y: number; z: number }; // m/s²
  gyroscope?: { x: number; y: number; z: number }; // rad/s
  heartRate?: number; // bpm
  orientation?: 'upright' | 'tilted' | 'horizontal';
  timestamp: number;
}

export interface DetectionConfig {
  sensitivity: SensitivityLevel;
  impactThreshold: number; // m/s² (default: 20, commercial: 30)
  immobilityTimeout: number; // seconds (default: 10)
  heartRateSpikeThreshold: number; // bpm above baseline (default: 30)
  minimumConfidence: number; // 0-1 (default: 0.7)
  userEscalationTimeout: number; // seconds (default: 30)
  familyEscalationTimeout: number; // seconds (default: 150)
  emergencyCallTimeout: number; // seconds (default: 180)
}

// Default config — lower thresholds than commercial for elderly sensitivity
const DEFAULT_CONFIG: DetectionConfig = {
  sensitivity: 'medium',
  impactThreshold: 20, // Commercial apps use 30, we use 20 for elderly
  immobilityTimeout: 10,
  heartRateSpikeThreshold: 30,
  minimumConfidence: 0.7,
  userEscalationTimeout: 30,
  familyEscalationTimeout: 150,
  emergencyCallTimeout: 180,
};

// Sensitivity presets
const SENSITIVITY_CONFIGS: Record<SensitivityLevel, Partial<DetectionConfig>> = {
  low: { impactThreshold: 25, minimumConfidence: 0.85, immobilityTimeout: 15 },
  medium: { impactThreshold: 20, minimumConfidence: 0.7, immobilityTimeout: 10 },
  high: { impactThreshold: 15, minimumConfidence: 0.5, immobilityTimeout: 5 },
};

/**
 * 5-factor fall detection algorithm
 * Weighted: impact 30%, orientation 25%, pre-movement 20%, HR 15%, stillness 10%
 */
export function detectFall(
  readings: SensorReading[],
  baselineHeartRate: number = 70,
  config: Partial<DetectionConfig> = {}
): { detected: boolean; confidence: number; severity: FallSeverity; factors: Record<string, number> } {
  const cfg = { ...DEFAULT_CONFIG, ...SENSITIVITY_CONFIGS[config.sensitivity || 'medium'], ...config };
  
  if (readings.length < 3) {
    return { detected: false, confidence: 0, severity: 'low', factors: {} };
  }

  const latest = readings[readings.length - 1];
  const previous = readings.slice(0, -1);

  // Factor 1: Impact spike (weight: 30%)
  const impactMagnitude = Math.sqrt(
    latest.accelerometer.x ** 2 + latest.accelerometer.y ** 2 + latest.accelerometer.z ** 2
  );
  const impactScore = Math.min(impactMagnitude / cfg.impactThreshold, 1);
  const impactDetected = impactMagnitude >= cfg.impactThreshold;

  // Factor 2: Post-impact immobility (weight: 10%)
  // Check if readings after impact show minimal movement
  const postImpactReadings = readings.slice(-3);
  const avgPostMovement = postImpactReadings.reduce((sum, r) => {
    return sum + Math.sqrt(r.accelerometer.x ** 2 + r.accelerometer.y ** 2 + r.accelerometer.z ** 2);
  }, 0) / postImpactReadings.length;
  const immobilityScore = avgPostMovement < 12 ? 1 : avgPostMovement < 15 ? 0.5 : 0;

  // Factor 3: Orientation change (weight: 25%)
  const firstOrientation = readings[0].orientation;
  const lastOrientation = latest.orientation;
  const orientationChanged = firstOrientation === 'upright' && lastOrientation === 'horizontal';
  const orientationScore = orientationChanged ? 1 : lastOrientation === 'tilted' ? 0.5 : 0;

  // Factor 4: Heart rate spike (weight: 15%)
  const currentHR = latest.heartRate || 0;
  const hrSpike = currentHR - baselineHeartRate;
  const hrSpikeDetected = hrSpike >= cfg.heartRateSpikeThreshold;
  const hrScore = hrSpikeDetected ? 1 : hrSpike > 15 ? 0.5 : 0;

  // Factor 5: Pre-impact movement pattern (weight: 20%)
  // Walking then sudden stop = higher confidence
  const preReadings = previous.slice(-5);
  const preMovement = preReadings.reduce((sum, r) => {
    return sum + Math.sqrt(r.accelerometer.x ** 2 + r.accelerometer.y ** 2 + r.accelerometer.z ** 2);
  }, 0) / Math.max(preReadings.length, 1);
  const preMovementPattern = preMovement > 10 && preMovement < 20; // Walking range
  const preMovementScore = preMovementPattern ? 1 : preMovement > 5 ? 0.5 : 0;

  // Calculate weighted confidence
  const confidence = (
    impactScore * 0.30 +
    orientationScore * 0.25 +
    preMovementScore * 0.20 +
    hrScore * 0.15 +
    immobilityScore * 0.10
  );

  // Determine severity
  let severity: FallSeverity = 'low';
  if (confidence >= 0.9) severity = 'critical';
  else if (confidence >= 0.75) severity = 'high';
  else if (confidence >= 0.5) severity = 'medium';

  const detected = confidence >= cfg.minimumConfidence && impactDetected;

  return {
    detected,
    confidence,
    severity,
    factors: {
      impact: impactScore,
      orientation: orientationScore,
      preMovement: preMovementScore,
      heartRate: hrScore,
      immobility: immobilityScore,
    },
  };
}

/**
 * Activity monitoring for anomaly detection (family dashboard)
 */
export interface DailyActivityMetrics {
  userId: string;
  date: string;
  steps: number;
  activeMinutes: number;
  heartRate: { min: number; max: number; avg: number; resting: number };
  sleepHours: number;
  sleepQuality: 'poor' | 'fair' | 'good' | 'excellent';
  lastMovement: Date;
  deviceBattery: number;
  deviceLastSeen: Date;
}

export interface ActivityAnomaly {
  type: 'low_activity' | 'high_heart_rate' | 'no_movement' | 'device_removed';
  severity: 'warning' | 'alert' | 'critical';
  message: string;
  detectedAt: Date;
}

/**
 * Detect anomalies in daily activity
 */
export function detectAnomalies(
  today: DailyActivityMetrics,
  avgMetrics: { avgSteps: number; avgActiveMin: number; avgHeartRate: number }
): ActivityAnomaly[] {
  const anomalies: ActivityAnomaly[] = [];
  const now = new Date();

  // Low activity: <30% of average + <15 active minutes
  if (today.steps < avgMetrics.avgSteps * 0.3 && today.activeMinutes < 15) {
    anomalies.push({
      type: 'low_activity',
      severity: 'warning',
      message: `Activity is significantly below average (${today.steps} steps vs ${avgMetrics.avgSteps} avg)`,
      detectedAt: now,
    });
  }

  // High heart rate: >1.3x baseline
  if (today.heartRate.avg > avgMetrics.avgHeartRate * 1.3) {
    anomalies.push({
      type: 'high_heart_rate',
      severity: 'alert',
      message: `Heart rate elevated (${today.heartRate.avg} bpm vs ${avgMetrics.avgHeartRate} avg)`,
      detectedAt: now,
    });
  }

  // No movement: >2h during waking hours (7am-9pm)
  const hoursSinceMovement = (now.getTime() - today.lastMovement.getTime()) / (1000 * 60 * 60);
  const currentHour = now.getHours();
  if (hoursSinceMovement > 2 && currentHour >= 7 && currentHour <= 21) {
    anomalies.push({
      type: 'no_movement',
      severity: 'alert',
      message: `No movement detected for ${Math.round(hoursSinceMovement)} hours`,
      detectedAt: now,
    });
  }

  // Device removed: battery 0% or not seen for 1h+
  const hoursSinceDevice = (now.getTime() - today.deviceLastSeen.getTime()) / (1000 * 60 * 60);
  if (today.deviceBattery === 0 || hoursSinceDevice > 1) {
    anomalies.push({
      type: 'device_removed',
      severity: 'warning',
      message: today.deviceBattery === 0 
        ? 'Device battery is empty — please charge'
        : `Device not seen for ${Math.round(hoursSinceDevice)} hours`,
      detectedAt: now,
    });
  }

  return anomalies;
}

/**
 * Process incoming fall detection event
 */
export async function processFallEvent(
  event: Omit<FallEvent, 'id' | 'responseTimeline' | 'status'>,
  db: any
): Promise<FallEvent> {
  const fallEvent: FallEvent = {
    ...event,
    id: `fall_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    status: 'detected',
    responseTimeline: [{
      timestamp: new Date(),
      action: 'fall_detected',
      actor: 'system',
      result: `Confidence: ${event.confidence}, Severity: ${event.severity}`,
    }],
  };

  // Store in database
  await db.query(`
    INSERT INTO fall_events (id, user_id, device_type, detected_at, severity, confidence, 
      latitude, longitude, impact_magnitude, immobility_duration, status)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
  `, [
    fallEvent.id, fallEvent.userId, fallEvent.deviceType, fallEvent.timestamp,
    fallEvent.severity, fallEvent.confidence, fallEvent.location?.lat, fallEvent.location?.lng,
    fallEvent.impactMagnitude, fallEvent.immobilityDuration, fallEvent.status,
  ]);

  return fallEvent;
}
