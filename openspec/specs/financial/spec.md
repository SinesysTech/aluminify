# Financial Module Specification

### Requirement: Transaction Management

The system SHALL provide a unified transaction management system that tracks all sales regardless of payment provider (Hotmart, internal checkout, manual entry).

Each transaction MUST contain:
- Unique identifier
- Provider information (source of the transaction)
- Buyer information (email, name, document)
- Product/offer information
- Payment details (amount, method, installments)
- Status tracking
- Timestamps (sale date, confirmation date)

Transactions MUST be isolated by `empresa_id` for multi-tenant support.

#### Scenario: Create transaction from Hotmart webhook
- **WHEN** Hotmart sends a `purchase_approved` webhook
- **AND** the webhook signature is valid
- **THEN** a new transaction is created with status `approved`
- **AND** the transaction contains all buyer and payment information
- **AND** if a student with the buyer email exists, the transaction is linked to that student

#### Scenario: Create transaction from Hotmart webhook - student does not exist
- **WHEN** Hotmart sends a `purchase_approved` webhook
- **AND** no student exists with the buyer email
- **THEN** a new auth user is created with the buyer email
- **AND** a new student record is created with buyer information
- **AND** the transaction is linked to the new student

#### Scenario: Duplicate webhook handling
- **WHEN** Hotmart sends a webhook with a transaction ID that already exists
- **THEN** the existing transaction is updated (not duplicated)
- **AND** the operation is idempotent

#### Scenario: List transactions with filters
- **WHEN** an admin requests the transaction list
- **THEN** only transactions from their empresa are returned
- **AND** the list can be filtered by status, date range, provider, and product
- **AND** the list supports pagination and sorting

#### Scenario: Transaction cancellation
- **WHEN** Hotmart sends a `purchase_canceled` webhook
- **THEN** the transaction status is updated to `cancelled`
- **AND** the student access is NOT automatically revoked (manual action required)

#### Scenario: Transaction refund
- **WHEN** Hotmart sends a `purchase_refunded` webhook
- **THEN** the transaction status is updated to `refunded`
- **AND** the refund amount and date are recorded

---

### Requirement: Product Catalog

The system SHALL maintain a product catalog that can be synchronized with external providers (Hotmart) or created internally.

Each product MUST contain:
- Name and description
- Price information
- Optional link to a curso
- Provider-specific identifiers (for sync)
- Active/inactive status

#### Scenario: Sync product from Hotmart
- **WHEN** a transaction webhook contains a new product ID
- **THEN** a product record is created with available information
- **AND** the product is marked as provider `hotmart`

#### Scenario: Create internal product
- **WHEN** an admin creates a product without provider information
- **THEN** the product is marked as provider `internal`
- **AND** the product can be linked to a curso

#### Scenario: Link product to curso
- **WHEN** a product is linked to a curso
- **AND** a transaction for that product is approved
- **THEN** the student can be automatically enrolled in the curso

---

### Requirement: Coupon Management

The system SHALL support discount coupons that can be tracked across transactions.

Each coupon MUST contain:
- Unique code per empresa
- Discount type (percentage or fixed amount)
- Discount value
- Usage limits (max uses, validity period)
- Usage counter

#### Scenario: Track coupon usage from transaction
- **WHEN** a transaction includes a coupon code
- **THEN** the coupon usage counter is incremented
- **AND** the transaction records the coupon used

#### Scenario: Create coupon
- **WHEN** an admin creates a coupon
- **THEN** the coupon code must be unique within the empresa
- **AND** the coupon can have optional usage limits

---

### Requirement: Financial Dashboard

The system SHALL provide a financial dashboard with sales metrics and visualizations.

The dashboard MUST display:
- Total sales amount for the period
- Number of transactions
- Average ticket value
- Sales by payment method
- Recent transactions
- Sales trend chart

#### Scenario: View dashboard with date filter
- **WHEN** an admin accesses the financial dashboard
- **AND** selects a date range
- **THEN** all metrics are calculated for that period
- **AND** only transactions from their empresa are included

#### Scenario: Export transactions
- **WHEN** an admin requests a transaction export
- **THEN** a CSV file is generated with all filtered transactions
- **AND** the file includes all relevant transaction details

---

### Requirement: Hotmart Webhook Integration

The system SHALL provide a secure webhook endpoint for receiving Hotmart notifications.

The webhook handler MUST:
- Validate the Hotmart signature (hottok)
- Process supported event types
- Return appropriate HTTP status codes
- Log all webhook attempts

Supported events:
- `purchase_approved` - New sale confirmed
- `purchase_canceled` - Sale canceled
- `purchase_refunded` - Sale refunded
- `purchase_complete` - Subscription completed (future)
- `purchase_protest` - Payment disputed

#### Scenario: Valid webhook received
- **WHEN** Hotmart sends a webhook with valid signature
- **THEN** the event is processed according to its type
- **AND** HTTP 200 is returned

#### Scenario: Invalid webhook signature
- **WHEN** a webhook is received with invalid signature
- **THEN** HTTP 401 is returned
- **AND** the event is NOT processed
- **AND** the attempt is logged for security audit

#### Scenario: Unknown event type
- **WHEN** a webhook with an unknown event type is received
- **THEN** HTTP 200 is returned (to prevent retries)
- **AND** the event is logged for review

---

### Requirement: Transaction Import

The system SHALL support bulk import of transactions from spreadsheet files.

The import process MUST:
- Accept Excel/CSV files
- Validate required fields
- Match or create students by email
- Handle duplicates gracefully
- Report import results

#### Scenario: Import Hotmart sales history
- **WHEN** an admin uploads a Hotmart sales history file
- **THEN** transactions are created for each approved sale
- **AND** students are matched by email or created
- **AND** a summary report shows created, updated, and failed records

#### Scenario: Import with duplicate transactions
- **WHEN** the import file contains a transaction that already exists
- **THEN** the existing transaction is updated (not duplicated)
- **AND** the summary shows it as "updated"

---

### Requirement: Payment Provider Configuration

The system SHALL allow configuration of payment provider credentials per empresa.

Each provider configuration MUST contain:
- Provider type (hotmart, stripe, etc.)
- Display name
- Encrypted credentials
- Webhook secret
- Active status

#### Scenario: Configure Hotmart integration
- **WHEN** an admin configures Hotmart integration
- **THEN** they provide the hottok for webhook validation
- **AND** the credentials are stored encrypted
- **AND** the webhook URL is displayed for configuration in Hotmart

---

### Requirement: Multi-tenant Data Isolation

All financial data MUST be isolated by empresa using Row Level Security.

#### Scenario: Query transactions from different empresa
- **WHEN** a user queries transactions
- **THEN** only transactions from their empresa are returned
- **AND** RLS policies enforce this at the database level

#### Scenario: Webhook creates transaction for specific empresa
- **WHEN** a Hotmart webhook is received
- **THEN** the transaction is associated with the empresa linked to that Hotmart account
- **AND** the empresa is determined by the product or webhook configuration
