import fetch from 'node-fetch'
import * as dotenv from 'dotenv'

dotenv.config()

const { KLAVIYO_SFRA_PRIVATE_KEY, KLAVIYO_SITEGEN_PRIVATE_KEY, KLAVIYO_V3_URL } = process.env

const apiEndpoint = `https://${KLAVIYO_V3_URL}`
const metricsEndpoint = '/metrics/'

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

let sfIntegrations

const getLatestMetricId = async () => {
  const metricsFilter = '?fields[metric]=integration'
  const integrationName = 'Salesforce Commerce Cloud'
  const endpoint = `${apiEndpoint}${metricsEndpoint}${metricsFilter}`

  try {
    const response = await fetch(endpoint, sfraOpts)
    const body = await response.json()
    const data = body.data
    sfIntegrations = data.filter(
      (integration) => integration.attributes.integration.name === integrationName
    )
  } catch {
    const response = await fetch(endpoint, sgOpts)
    const body = await response.json()
    const data = body.data
    sfIntegrations = data.filter(
      (integration) => integration.attributes.integration.name === integrationName
    )
  }

  const mostRecentMetric = await sfIntegrations.reduce((latest, current) => {
      const latestDate = new Date(latest.attributes.created)
      const currentDate = new Date(current.attributes.created)

      return latestDate > currentDate ? latest : current
  })

  return mostRecentMetric.id
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