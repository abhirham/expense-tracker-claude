# Finance Tracker

## Project Overview
Local finance tracking application for Ontario, Canada banks using SimpleFin Bridge to fetch transactions and Claude AI to categorize them.

## Tech Stack
- **Language**: Python 3.9+
- **APIs**: SimpleFin Bridge API, Anthropic Claude AI API
- **Dependencies**: requests, anthropic, python-dotenv

## Purpose
1. Connect to banks via SimpleFin Bridge
2. Fetch all transactions from connected accounts
3. Categorize transactions using Claude AI
4. Output results as TSV for Google Sheets

## Transaction Categories
The app categorizes transactions into these predefined categories:
- Car
- Groceries
- Restaurants
- Health
- Shopping
- Entertainment
- Home
- Transport
- Personal Care
- Coffee Shop
- Misc
- Pets
- Financial
- Utilities

## Environment Variables
Store credentials in `.env` file:
```
SIMPLEFIN_ACCESS_URL=https://username:password@bridge.simplefin.org/simplefin
ANTHROPIC_API_KEY=sk-ant-...
```

## Output Format
TSV with columns: Date | Description | Amount | Account | Category

## Important Constraints
- **Local only**: No deployment, runs locally on user's machine
- **SimpleFin rate limit**: Max 24 requests per day
- **Authentication**: SimpleFin uses access URL with embedded Basic Auth credentials
- **Security**: Never commit `.env` file to version control

## SimpleFin API Notes
- Access URL contains embedded credentials
- Main endpoint: GET /accounts (returns all accounts and transactions)
- Supports filtering by date ranges
- Returns JSON with account and transaction data
