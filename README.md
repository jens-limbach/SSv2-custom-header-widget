# CRM Scoring Widget

A minimal micro-frontend for embedding a visual "custom scoring" component in SAP Sales and Service Cloud V2. It shows how easy it is to add completly custom UX elements anywhere where you can place a mashup.

And mashups can be placed in almost any place like: the quick create, the quick view, a new tab in an object or like in this example in the header area of an object.


## ✨ Features

- ✅ **Single Input Field & Slider** - Type or drag to set score (0-100)
- ✅ **Dark Blue Header Integration** - Background: `#00144a` (SAP CRM dark blue)
- ✅ **Auto-Save Logic** - Saves on Enter, blur, or slider release
- ✅ **SAP Sales and Service Cloud V2 Styling** - Seamless integration with CRM interface
- ✅ **Input Validation** - Values clamped to 0-100 range with error handling
- ✅ **Secure Express Proxy** - Server-side API calls with Basic Auth
- ✅ **No Framework Dependencies** - Pure HTML/CSS/JavaScript
- ✅ **Lightweight** - ~130KB total (CSS + JS)

## 🚀 Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure SAP CRM Credentials

```bash
cd server
copy env-template.txt .env
```

Edit [server/.env](server/.env) with your credentials:

```env
CRM_BASE_URL=https://your-tenant.crm.cloud.sap
CRM_USERNAME=your-username
CRM_PASSWORD=your-password
PORT=3000
```

### 3. Start Development Server

```bash
npm run dev:server
```

### 4. Test the Widget

Open in browser with an account UUID:
```
http://localhost:3000/?accountId=YOUR_ACCOUNT_UUID_HERE
```

## 🎨 Usage

### Embedding as iframe in SAP CRM

Use the standard Mashup functionality to create first a mashup and then add it to the Account header.

For more information on SAP Sales and Service Cloud V2 extensibility, see the [SAP Help Portal - Mashup Page Extensibility](https://help.sap.com/docs/CX_NG_SALES/348d3cace0eb4146a4af6e018cbbb88c/5a9d11b0c9944e49bb2c556be534b40f.html).

### URL Parameters

- `accountId` (required): UUID of the SAP CRM account to edit

### Auto-save Triggers

The widget automatically saves when:
1. User presses **Enter** in the input field
2. User moves focus away from input (**blur** event)  
3. User releases mouse after dragging slider (**mouseup** event)

### Data Structure

The widget reads and writes to the account's extensions field:
```json
{
  "extensions": {
    "CustomScore": "80"
  }
}
```

## 🚀 Deployment

### Cloud Foundry (SAP BTP)

```bash
# Deploy the application
cf push

# Set environment variables in production
cf set-env crm-scoring-widget CRM_BASE_URL "https://your-tenant.crm.cloud.sap"
cf set-env crm-scoring-widget CRM_USERNAME "your-username"
cf set-env crm-scoring-widget CRM_PASSWORD "your-password"
cf restage crm-scoring-widget
```

## 📁 Project Structure

```
crm-scoring-widget/
├── server/
│   ├── index.js           # Express server with API proxy (74 lines)
│   ├── package.json       # Server dependencies
│   ├── .env              # Your credentials (git-ignored)
│   └── env-template.txt  # Template for .env
├── public/
│   ├── index.html        # Widget UI (150 lines)
│   ├── app.js           # Vanilla JS logic (180 lines)
│   └── css/             # SAP CSS files (~108KB total)
│       ├── sap-crm-colors.css       (16KB)
│       ├── sap-crm-global.css       (6KB)
│       └── sap-crm-components.css   (86KB)
├── package.json         # Root scripts and project config
├── manifest.yml        # Cloud Foundry deployment config
└── README.md          # This documentation
```

## 🔌 API Endpoints

- `GET /health` - Health check endpoint
- `GET /api/accounts/:id` - Fetch account data from SAP CRM
- `PATCH /api/accounts/:id` - Update account extensions in SAP CRM

## ⚙️ Technical Details

- **Framework**: None - Pure HTML/CSS/JavaScript for maximum compatibility
- **Theme**: Dark theme with `#00144a` background for CRM integration
- **Validation**: Input values automatically clamped to 0-100 range
- **Error Handling**: Reverts to previous value on save failure
- **Optimistic Locking**: Uses If-Match header to prevent conflicts
- **Security**: Basic Auth credentials handled server-side only
- **Performance**: Direct API calls with no framework overhead

## 🐛 Troubleshooting

**"No accountId provided"**
- Add `?accountId=YOUR_UUID` to the URL

**"Failed to load account"**
- Check [server/.env](server/.env) credentials are correct
- Verify `CRM_BASE_URL` matches your SAP tenant
- Confirm account UUID exists in your CRM system

**"Failed to save"**
- Check browser console for detailed error messages
- Verify account isn't locked by another user
- Check If-Match header conflicts (optimistic locking)

**CSS styling issues**
- Verify all 3 CSS files exist in [public/css/](public/css/)
- Check browser console for 404 errors on CSS files

## 📝 Common Commands

```bash
# Install all dependencies
npm install

# Start development server
npm run dev:server

# Deploy to Cloud Foundry
cf push

# Configure production environment
cf set-env crm-scoring-widget CRM_BASE_URL "https://your-tenant.crm.cloud.sap"
cf set-env crm-scoring-widget CRM_USERNAME "your-username"
cf set-env crm-scoring-widget CRM_PASSWORD "your-password"
cf restage crm-scoring-widget
```
