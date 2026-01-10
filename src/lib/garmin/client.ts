import { GarminConnect } from 'garmin-connect'

export async function createGarminClient(email: string, password: string) {
  const client = new GarminConnect({
    username: email,
    password: password,
  })
  
  await client.login()
  return client
}

export async function createGarminClientFromTokens(
  oauth1Token: any,
  oauth2Token: any
) {
  const client = new GarminConnect({
    username: 'token-auth',
    password: 'token-auth',
  })
  client.loadToken(oauth1Token, oauth2Token)
  return client
}

export function getGarminTokens(client: GarminConnect) {
  return {
    oauth1Token: client.client.oauth1Token,
    oauth2Token: client.client.oauth2Token,
  }
}

export async function fetchGarminData(client: GarminConnect, date: Date) {
  const [sleepData, steps, heartRate] = await Promise.allSettled([
    client.getSleepData(date),
    client.getSteps(date),
    client.getHeartRate(date),
  ])

  return {
    sleep: sleepData.status === 'fulfilled' ? sleepData.value : null,
    steps: steps.status === 'fulfilled' ? steps.value : null,
    heartRate: heartRate.status === 'fulfilled' ? heartRate.value : null,
  }
}

export function parseSleepData(sleepData: any) {
  if (!sleepData?.dailySleepDTO) return null
  
  const dto = sleepData.dailySleepDTO
  return {
    sleep_duration_seconds: dto.sleepTimeSeconds || null,
    deep_sleep_seconds: dto.deepSleepSeconds || null,
    light_sleep_seconds: dto.lightSleepSeconds || null,
    rem_sleep_seconds: dto.remSleepSeconds || null,
    awake_seconds: dto.awakeSleepSeconds || null,
    sleep_start: dto.sleepStartTimestampGMT ? new Date(dto.sleepStartTimestampGMT).toISOString() : null,
    sleep_end: dto.sleepEndTimestampGMT ? new Date(dto.sleepEndTimestampGMT).toISOString() : null,
  }
}

export function parseHeartRateData(heartRateData: any) {
  if (!heartRateData) return null
  
  return {
    resting_heart_rate: heartRateData.restingHeartRate || null,
    min_heart_rate: heartRateData.minHeartRate || null,
    max_heart_rate: heartRateData.maxHeartRate || null,
    avg_heart_rate: null,
  }
}

export async function fetchActivities(client: GarminConnect, start = 0, limit = 20) {
  const activities = await client.getActivities(start, limit)
  return activities || []
}

export function parseActivityData(activity: any) {
  return {
    garmin_activity_id: activity.activityId,
    activity_name: activity.activityName || null,
    activity_type: activity.activityType?.typeKey || null,
    activity_type_id: activity.activityType?.typeId || null,
    start_time: activity.startTimeGMT ? new Date(activity.startTimeGMT).toISOString() : null,
    duration_seconds: activity.duration || null,
    moving_duration_seconds: activity.movingDuration || null,
    elapsed_duration_seconds: activity.elapsedDuration || null,
    distance_meters: activity.distance || null,
    calories: activity.calories || null,
    avg_heart_rate: activity.averageHR || null,
    max_heart_rate: activity.maxHR || null,
    avg_speed: activity.averageSpeed || null,
    max_speed: activity.maxSpeed || null,
    elevation_gain: activity.elevationGain || null,
    elevation_loss: activity.elevationLoss || null,
    steps: activity.steps || null,
    avg_cadence: activity.averageRunningCadenceInStepsPerMinute || null,
    max_cadence: activity.maxRunningCadenceInStepsPerMinute || null,
    avg_power: activity.avgPower || null,
    max_power: activity.maxPower || null,
    total_sets: activity.totalSets || null,
    total_reps: activity.totalReps || null,
    location_name: activity.locationName || null,
    start_latitude: activity.startLatitude || null,
    start_longitude: activity.startLongitude || null,
    has_polyline: activity.hasPolyline || false,
    favorite: activity.favorite || false,
    raw_data: activity,
  }
}
