#!/usr/bin/env python3
"""
Finance Tracker - TD Bank Transaction Categorization
Fetches transactions from TD Bank via SimpleFin Bridge and categorizes them using Claude AI.
"""

import os
import sys
import json
import base64
from datetime import datetime
from typing import List, Dict, Any, Optional
from urllib.parse import urlparse
import requests
from anthropic import Anthropic
from dotenv import load_dotenv


# Transaction categories
CATEGORIES = [
    "Car",
    "Groceries",
    "Restaurants",
    "Health",
    "Shopping",
    "Entertainment",
    "Home",
    "Transport",
    "Personal Care",
    "Coffee Shop",
    "Misc",
    "Pets",
    "Financial",
    "Utilities"
]


class SimpleFinClient:
    """Client for SimpleFin Bridge API"""

    def __init__(self, credential: str):
        """
        Initialize with either:
        - Setup Token (base64 encoded claim URL) for first-time setup
        - Access URL (https://username:password@bridge.simplefin.org/simplefin) for ongoing use
        """
        self.access_url: Optional[str] = None

        # Check if this is a setup token or access URL
        if credential.startswith('http'):
            # Already an access URL
            self.access_url = credential
        else:
            # Setup token - need to claim it first
            self.access_url = self._claim_access_url(credential)

    def _claim_access_url(self, setup_token: str) -> str:
        """Exchange setup token for access URL (one-time operation)"""
        try:
            # Decode base64 setup token to get claim URL
            claim_url = base64.b64decode(setup_token).decode('utf-8')
            print(f"Claiming access URL from SimpleFin...", file=sys.stderr)

            # POST to claim URL to get access URL
            response = requests.post(claim_url, timeout=30)
            response.raise_for_status()

            access_url = response.text.strip()

            # Save access URL to .env for future use
            print(f"\nAccess URL obtained successfully!", file=sys.stderr)
            print(f"Add this to your .env file:\nSIMPLEFIN_ACCESS_URL={access_url}\n", file=sys.stderr)

            return access_url

        except Exception as e:
            print(f"Error claiming access URL: {e}", file=sys.stderr)
            sys.exit(1)

    def get_accounts(self) -> Dict[str, Any]:
        """Fetch all accounts and transactions from SimpleFin"""
        try:
            # Parse access URL to extract credentials
            parsed = urlparse(self.access_url)
            username = parsed.username
            password = parsed.password

            # Reconstruct base URL without credentials
            base_url = f"{parsed.scheme}://{parsed.hostname}"
            if parsed.port:
                base_url += f":{parsed.port}"
            base_url += parsed.path

            # Make request with Basic Auth
            response = requests.get(
                f"{base_url}/accounts",
                auth=(username, password),
                timeout=30
            )
            response.raise_for_status()

            data = response.json()

            # Check for errors in response
            if 'errors' in data and data['errors']:
                print(f"SimpleFin errors: {data['errors']}", file=sys.stderr)

            return data

        except requests.exceptions.RequestException as e:
            print(f"Error fetching data from SimpleFin: {e}", file=sys.stderr)
            sys.exit(1)


class TransactionCategorizer:
    """Categorizes transactions using Claude AI"""

    def __init__(self, api_key: str):
        """Initialize Anthropic client"""
        self.client = Anthropic(api_key=api_key)

    def categorize_transactions(self, transactions: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Categorize a batch of transactions using Claude"""
        if not transactions:
            return []

        # Prepare transaction data for Claude
        transaction_list = []
        for idx, txn in enumerate(transactions):
            transaction_list.append(f"{idx}: {txn['description']} - ${txn['amount']}")

        prompt = f"""Categorize each transaction into one of these categories: {', '.join(CATEGORIES)}

Transactions:
{chr(10).join(transaction_list)}

Respond with ONLY a JSON array where each element is the category name for the corresponding transaction index. Example format:
["Groceries", "Restaurants", "Transport", ...]"""

        try:
            message = self.client.messages.create(
                model="claude-3-5-sonnet-20241022",
                max_tokens=2000,
                messages=[
                    {"role": "user", "content": prompt}
                ]
            )

            # Parse response
            response_text = message.content[0].text.strip()
            categories = json.loads(response_text)

            # Add categories to transactions
            categorized = []
            for idx, txn in enumerate(transactions):
                txn_copy = txn.copy()
                txn_copy['category'] = categories[idx] if idx < len(categories) else 'Misc'
                categorized.append(txn_copy)

            return categorized

        except Exception as e:
            print(f"Error categorizing transactions: {e}", file=sys.stderr)
            # Return transactions with 'Misc' category as fallback
            return [{**txn, 'category': 'Misc'} for txn in transactions]


def format_date(timestamp: int) -> str:
    """Convert Unix timestamp to YYYY-MM-DD format"""
    return datetime.fromtimestamp(timestamp).strftime('%Y-%m-%d')


def format_amount(amount: float) -> str:
    """Format amount as currency"""
    return f"{amount:.2f}"


def extract_transactions(accounts_data: Dict[str, Any]) -> List[Dict[str, Any]]:
    """Extract all transactions from SimpleFin accounts response"""
    transactions = []

    for account in accounts_data.get('accounts', []):
        account_name = account.get('name', 'Unknown Account')

        for txn in account.get('transactions', []):
            transactions.append({
                'date': txn.get('posted', txn.get('transacted_at', 0)),
                'description': txn.get('description', 'Unknown'),
                'amount': abs(txn.get('amount', 0)),  # Use absolute value
                'account': account_name
            })

    return transactions


def output_tsv(transactions: List[Dict[str, Any]]) -> None:
    """Output transactions as TSV format"""
    # Print header
    print("Date\tDescription\tAmount\tAccount\tCategory")

    # Print transactions
    for txn in transactions:
        date = format_date(txn['date'])
        description = txn['description']
        amount = format_amount(txn['amount'])
        account = txn['account']
        category = txn['category']

        print(f"{date}\t{description}\t{amount}\t{account}\t{category}")


def main():
    """Main application entry point"""
    # Load environment variables
    load_dotenv()

    simplefin_credential = os.getenv('SIMPLEFIN_ACCESS_URL') or os.getenv('SIMPLEFIN_SETUP_TOKEN')
    anthropic_key = os.getenv('ANTHROPIC_API_KEY')

    if not simplefin_credential:
        print("Error: SIMPLEFIN_ACCESS_URL or SIMPLEFIN_SETUP_TOKEN not found in .env file", file=sys.stderr)
        print("Get a setup token from SimpleFin Bridge after connecting TD Bank", file=sys.stderr)
        sys.exit(1)

    if not anthropic_key:
        print("Error: ANTHROPIC_API_KEY not found in .env file", file=sys.stderr)
        sys.exit(1)

    # Fetch transactions from SimpleFin
    print("Fetching transactions from TD Bank...", file=sys.stderr)
    simplefin = SimpleFinClient(simplefin_credential)
    accounts_data = simplefin.get_accounts()

    # Extract transactions
    transactions = extract_transactions(accounts_data)
    print(f"Found {len(transactions)} transactions", file=sys.stderr)

    if not transactions:
        print("No transactions found", file=sys.stderr)
        sys.exit(0)

    # Categorize transactions using Claude
    print("Categorizing transactions with Claude AI...", file=sys.stderr)
    categorizer = TransactionCategorizer(anthropic_key)
    categorized_transactions = categorizer.categorize_transactions(transactions)

    # Output as TSV
    output_tsv(categorized_transactions)
    print(f"\nSuccess! {len(categorized_transactions)} transactions categorized", file=sys.stderr)


if __name__ == "__main__":
    main()
