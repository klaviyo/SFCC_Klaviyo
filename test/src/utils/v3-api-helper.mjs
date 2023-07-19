import fetch from 'node-fetch'
import * as dotenv from 'dotenv'

dotenv.config()

const { KLAVIYO_V3_URL } = process.env

const apiEndpoint = `https://${KLAVIYO_V3_URL}`
const metricsEndpoint = '/metrics/'

let sfIntegrations

const getLatestMetricId = async (params) => {
  const metricsFilter = '?fields[metric]=integration'
  const integrationName = 'Salesforce Commerce Cloud'
  const endpoint = `${apiEndpoint}${metricsEndpoint}${metricsFilter}`
  const requestMethod = params.method.toUpperCase()
  const apiKey = params.apiKey

  const requestObj = {
    method: `${requestMethod}`,
    headers: {
      accept: 'application/json',
      revision: '2023-02-22',
      Authorization: `Klaviyo-API-Key ${apiKey}`
    }
  }

  const response = await fetch(endpoint, requestObj)
  const body = await response.json()
  const data = body.data
  sfIntegrations = data.filter(
    (integration) => integration.attributes.integration.name === integrationName
  )

  const mostRecentMetric = await sfIntegrations.reduce((latest, current) => {
      const latestDate = new Date(latest.attributes.created)
      const currentDate = new Date(current.attributes.created)

      return latestDate > currentDate ? latest : current
  })

  return mostRecentMetric.id
}

const getLatestMetricData = async (params) => {
  const apiKey = params.apiKey
  const requestMethod = params.method.toUpperCase()
  const metricId = await getLatestMetricId(params)
  const endpoint = `${apiEndpoint}${metricsEndpoint}${metricId}`

  const requestObj = {
    method: `${requestMethod}`,
    headers: {
      accept: 'application/json',
      revision: '2023-02-22',
      Authorization: `Klaviyo-API-Key ${apiKey}`
    }
  }

  const response = await fetch(endpoint, requestObj)
  const body = await response.json()
  const data = body.data

  return data
}

export {
  getLatestMetricId,
  getLatestMetricData,
}