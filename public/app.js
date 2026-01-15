// CRM Scoring Widget - Vanilla JavaScript

let accountId = null
let currentScore = 0
let previousScore = 0
let accountData = null
let isSaving = false

// DOM Elements
const scoreInput = document.getElementById('customScore')
const scoreSlider = document.getElementById('scoreSlider')
const scoreDisplay = document.getElementById('scoreDisplay')
const loadingIndicator = document.getElementById('loadingIndicator')
const errorMessage = document.getElementById('errorMessage')
const editButton = document.getElementById('editButton')

// Initialize widget
async function init() {
  // Parse account ID from URL
  const params = new URLSearchParams(window.location.search)
  accountId = params.get('accountId')

  if (!accountId) {
    showError('No accountId provided in URL. Please provide ?accountId=YOUR_ACCOUNT_UUID')
    return
  }

  // Load account data
  await loadAccount()

  // Set up event listeners
  setupEventListeners()
}

// Load account from API
async function loadAccount() {
  try {
    const response = await fetch(`/api/accounts/${accountId}`)
    if (!response.ok) {
      throw new Error(`Failed to load account: ${response.statusText}`)
    }

    accountData = await response.json()
    
    // Extract CustomScore from extensions
    const customScore = accountData?.value?.extensions?.CustomScore
    currentScore = customScore ? parseInt(customScore, 10) : 0
    previousScore = currentScore

    // Update UI
    updateUI(currentScore)
    
    console.log('Account loaded:', accountData)
    console.log('Current score:', currentScore)
  } catch (error) {
    console.error('Error loading account:', error)
    showError(`Failed to load account: ${error.message}`)
  }
}

// Validation: clamp value to 0-100
function validateScore(value) {
  let num = parseInt(value, 10)
  if (isNaN(num)) return 0
  if (num < 0) return 0
  if (num > 100) return 100
  return num
}

// Update UI elements
function updateUI(score) {
  scoreInput.value = score
  scoreSlider.value = score
  scoreDisplay.textContent = `Score: ${score}/100`
  
  // Update slider CSS variable for progress fill
  const percentage = score + '%'
  scoreSlider.style.setProperty('--slider-value', percentage)
}

// Save score to API
async function saveScore() {
  if (isSaving) {
    console.log('Save already in progress, skipping...')
    return
  }

  const newScore = validateScore(scoreInput.value)
  
  // No change, skip save
  if (newScore === previousScore) {
    console.log('No change in score, skipping save')
    return
  }

  isSaving = true
  loadingIndicator.classList.add('visible')
  hideError()

  try {
    // Fetch fresh account to get latest updatedOn for If-Match
    const freshResponse = await fetch(`/api/accounts/${accountId}`)
    if (!freshResponse.ok) {
      throw new Error('Failed to fetch fresh account data')
    }

    const freshAccount = await freshResponse.json()
    const updatedOn = freshAccount?.value?.adminData?.updatedOn

    if (!updatedOn) {
      throw new Error('No updatedOn timestamp found for If-Match header')
    }

    // Wrap updatedOn in quotes for If-Match ETag format
    const ifMatch = `"${updatedOn}"`

    // Build PATCH payload
    const payload = {
      extensions: {
        CustomScore: newScore
      }
    }

    console.log('Saving score:', newScore, 'with If-Match:', ifMatch)

    // Send PATCH request
    const response = await fetch(`/api/accounts/${accountId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/merge-patch+json',
        'If-Match': ifMatch
      },
      body: JSON.stringify(payload)
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Save failed: ${response.status} ${errorText}`)
    }

    // Update successful
    previousScore = newScore
    currentScore = newScore
    console.log('Score saved successfully:', newScore)
    
    // Trigger refresh event in parent CRM UI
    triggerRefreshEvent()

  } catch (error) {
    console.error('Error saving score:', error)
    
    // Revert to previous value
    updateUI(previousScore)
    currentScore = previousScore
    
    showError(`Failed to save. Value reverted. ${error.message}`)
  } finally {
    isSaving = false
    loadingIndicator.classList.remove('visible')
  }
}

// Setup event listeners
function setupEventListeners() {
  // Input changes: sync with slider
  scoreInput.addEventListener('input', (e) => {
    const value = validateScore(e.target.value)
    currentScore = value
    scoreSlider.value = value
    scoreDisplay.textContent = `Score: ${value}/100`
    scoreSlider.style.setProperty('--slider-value', value + '%')
  })

  // Input blur: save and reset edit button
  scoreInput.addEventListener('blur', () => {
    if (!isSaving) {
      saveScore()
    }
    // Reset edit button state so it can appear on hover again
    editButton.classList.remove('force-hidden')
  })

  // Enter key: save
  scoreInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      saveScore()
    }
  })

  // Slider changes: sync with input
  scoreSlider.addEventListener('input', (e) => {
    const value = parseInt(e.target.value, 10)
    currentScore = value
    scoreInput.value = value
    scoreDisplay.textContent = `Score: ${value}/100`
    scoreSlider.style.setProperty('--slider-value', value + '%')
  })

  // Slider mouseup: save
  scoreSlider.addEventListener('mouseup', () => {
    if (!isSaving) {
      saveScore()
    }
  })

  // Slider touchend: save (for mobile)
  scoreSlider.addEventListener('touchend', () => {
    if (!isSaving) {
      saveScore()
    }
  })

  // Edit button: focus input and hide button
  editButton.addEventListener('click', () => {
    editButton.classList.add('force-hidden')
    scoreInput.focus()
  })

  // Hide edit button when input gets focus
  scoreInput.addEventListener('focus', () => {
    editButton.classList.add('force-hidden')
  })
}

// Show error message
function showError(message) {
  errorMessage.textContent = message
  errorMessage.classList.add('visible')
  
  // Auto-hide after 5 seconds
  setTimeout(() => {
    hideError()
  }, 5000)
}

// Hide error message
function hideError() {
  errorMessage.classList.remove('visible')
}

// Trigger refresh event in parent CRM UI
function triggerRefreshEvent() {
  var event = { 
    event: "accountRefreshEvent",
    operation: "triggerCustomAction"
  }
  window.parent.postMessage(event, '*')
  console.log('Refresh event triggered in parent CRM UI')
}

// Start the widget
init()
