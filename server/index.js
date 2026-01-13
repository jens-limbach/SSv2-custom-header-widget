import express from 'express'
import cors from 'cors'
import path from 'path'
import { fileURLToPath } from 'url'
import dotenv from 'dotenv'

dotenv.config()

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const app = express()
const PORT = process.env.PORT || 3000

// Middleware
app.use(cors())
app.use(express.json())
app.use(express.json({ type: 'application/merge-patch+json' }))

// SAP CRM API Configuration
const CRM_BASE_URL = process.env.CRM_BASE_URL
const CRM_USERNAME = process.env.CRM_USERNAME
const CRM_PASSWORD = process.env.CRM_PASSWORD

// Validate required environment variables
if (!CRM_BASE_URL || !CRM_USERNAME || !CRM_PASSWORD) {
  console.error('❌ ERROR: Missing required environment variables!')
  console.error('Please ensure the following are set in server/.env:')
  console.error('  - CRM_BASE_URL')
  console.error('  - CRM_USERNAME')
  console.error('  - CRM_PASSWORD')
  console.error('\nSee server/env-template.txt for configuration template.')
  process.exit(1)
}

// Create Basic Auth header
const authString = `${CRM_USERNAME}:${CRM_PASSWORD}`
const authHeader = 'Basic ' + Buffer.from(authString).toString('base64')

console.log(`✅ CRM API configured: ${CRM_BASE_URL}`)
console.log(`✅ Username: ${CRM_USERNAME}`)

// Helper function to make CRM API requests
async function crmRequest(endpoint, options = {}) {
  const url = `${CRM_BASE_URL}${endpoint}`
  
  const contentType = options.method === 'PATCH' 
    ? 'application/merge-patch+json' 
    : 'application/json'
  
  const headers = {
    'Authorization': authHeader,
    'Content-Type': contentType,
    ...options.headers
  }

  try {
    const response = await fetch(url, {
      ...options,
      headers
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`CRM API error: ${response.status} ${response.statusText} - ${errorText}`)
    }

    return await response.json()
  } catch (error) {
    console.error(`Error calling ${endpoint}:`, error.message)
    throw error
  }
}

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'CRM Scoring Widget API is running' })
})

// Get single account by ID
app.get('/api/accounts/:id', async (req, res) => {
  try {
    const { id } = req.params
    console.log(`Fetching account: ${id}`)
    
    const account = await crmRequest(`/sap/c4c/api/v1/account-service/accounts/${id}`)
    res.json(account)
  } catch (error) {
    console.error('Error fetching account:', error)
    res.status(500).json({ error: error.message })
  }
})

// Update account extensions.CustomScore
app.patch('/api/accounts/:id', async (req, res) => {
  try {
    const { id } = req.params
    const ifMatch = req.headers['if-match']
    
    if (!ifMatch) {
      return res.status(400).json({ error: 'If-Match header is required for updates' })
    }

    console.log(`Updating account: ${id}`)
    console.log(`If-Match: ${ifMatch}`)
    console.log(`Body:`, req.body)

    const updatedAccount = await crmRequest(
      `/sap/c4c/api/v1/account-service/accounts/${id}`,
      {
        method: 'PATCH',
        headers: {
          'If-Match': ifMatch
        },
        body: JSON.stringify(req.body)
      }
    )

    res.json(updatedAccount)
  } catch (error) {
    console.error('Error updating account:', error)
    res.status(500).json({ error: error.message })
  }
})

// Serve static files from public directory
app.use(express.static(path.join(__dirname, '../public')))

// Fallback to index.html for SPA routing
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'))
})

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`)
  console.log(`📊 Widget URL: http://localhost:${PORT}/?accountId=YOUR_ACCOUNT_UUID`)
})
