import fetch from 'node-fetch'
import * as dotenv from 'dotenv'
import { should } from 'chai'

dotenv.config()

const { KLAVIYO_SFRA_PRIVATE_KEY, KLAVIYO_SITEGEN_PRIVATE_KEY, KLAVIYO_V3_URL } = process.env

const apiEndpoint = `https://${KLAVIYO_V3_URL}`
const metricsEndpoint = '/metrics/'
const eventsEndpoint = '/events/'
const sortFilter = '?sort=-datetime'

const sfraOpts = {
  method: 'GET',
  headers: {
    accept: 'application/json',
    revision: '2023-02-22',
    Authorization: `Klaviyo-API-Key ${KLAVIYO_SFRA_PRIVATE_KEY}`
  },
}

const sgOpts = {
  method: 'GET',
  headers: {
    accept: 'application/json',
    revision: '2023-02-22',
    Authorization: `Klaviyo-API-Key ${KLAVIYO_SITEGEN_PRIVATE_KEY}`
  },
}

let integrationData

const getLatestMetricId = async () => {
  let endpoint = `${apiEndpoint}${eventsEndpoint}${sortFilter}`

  try {
    const response = await fetch(endpoint, sfraOpts)
    const body = await response.json()
    integrationData = body.data

  } catch {
    const response = await fetch(endpoint, sgOpts)
    const body = await response.json()
    integrationData = body.data
  }
    const firstMetric = integrationData[0]
    const metricData = firstMetric.relationships.metrics.data[0]

  return metricData.id
}

const getLatestMetricData = async (id) => {
  const metricId = await getLatestMetricId(id)
  const endpoint = `${apiEndpoint}${metricsEndpoint}${metricId}`

  try {
    const response = await fetch(endpoint, sfraOpts)
    const body = await response.json()
    const data = body.data
    return data
  } catch {
    const response = await fetch(endpoint, sgOpts)
    const body = await response.json()
    const data = body.data
    return data
  }
}

export { getLatestMetricId, getLatestMetricData }