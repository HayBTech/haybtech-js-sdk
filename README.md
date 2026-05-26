# HayBTech Node.js SDK

Official Node.js SDK for the HayBTech Payment Gateway API -- mobile payments across West Africa .

[![NPM](https://img.shields.io/npm/v/@haybtech/sdk.svg)](https://www.npmjs.com/package/@haybtech/sdk)
[![Node](https://img.shields.io/badge/node-%3E%3D16.0.0-green)](https://nodejs.org)
[![License](https://img.shields.io/badge/license-MIT-green)](LICENSE)

---

## Installation

```bash
npm install @haybtech/sdk
```

Or with Yarn:

```bash
yarn add @haybtech/sdk
```

---

## Quick Start (Zero-Config)

If you have `HAYBTECH_SECRET_KEY` set in your environment (e.g. via `.env`), you can initialize the SDK with zero configuration:

```javascript
const haybtech = require('@haybtech/sdk')();
```

*(Optional)* You can also pass the key explicitly:
```javascript
const haybtech = require('@haybtech/sdk')('sk_test_your_key');

// Using async/await
async function initiatePayment() {
  try {
    const response = await haybtech.payments.create({
      merchant_ref: 'ORDER-12345',
      amount: 5000,
      currency: 'XOF',
      success_url: 'https://mysite.com/success',
      failed_url: 'https://mysite.com/failed',
      callback_url: 'https://mysite.com/webhook'
    });

    console.log('Payment URL:', response.data.payment_url);
    
    // Express.js helper for redirection
    // response.redirect(res); 
  } catch (error) {
    console.error('API Error:', error.message);
  }
}
```

---

## Webhooks (Express.js)

Securely verify incoming webhooks from HayBTech:

```javascript
const { Webhook } = require('@haybtech/sdk');

// Important: Use raw body parser for webhook endpoints
app.post('/webhook', express.raw({ type: 'application/json' }), (req, res) => {
  const payload = req.body.toString();
  const signature = req.headers['x-haybtech-signature'];
  const secret = 'whsec_...';

  try {
    const event = Webhook.constructEvent(payload, signature, secret);
    
    switch (event.event) {
      case 'payment.success':
        // Mark order as paid
        break;
      case 'payment.failed':
        // Handle failure
        break;
        break;
    }
    
    res.status(200).send('OK');
  } catch (err) {
    res.status(400).send(`Webhook Error: ${err.message}`);
  }
});
```

---

## Available Events

| Event                     | Description              |
|:--------------------------|:-------------------------|
| `payment.initiated`       | Transaction created      |
| `payment.success`         | Payment confirmed        |
| `payment.failed`          | Payment failed           |
| `payment.cancelled`       | Cancelled by customer    |
| `payment.expired`         | Payment timed out        |
| `payout.success`          | Payout completed         |
| `payout.failed`           | Payout failed            |
| `refund.success`          | Refund processed         |

---

## Error Handling

```javascript
try {
  const response = await haybtech.payments.create(params);
} catch (error) {
  console.error(error.message);    // Human-readable message
  console.error(error.statusCode); // HTTP status (400, 422, 500...)
  console.error(error.code);       // e.g., "insufficient_funds"
}
```

---

## Test Mode

```javascript
const haybtech = require('@haybtech/sdk')('sk_test_...'); // No real charges
```

---


---

## Security Features

This SDK is built for **Maximum Security**:

- **Zero Dependencies**: No third-party libraries (no Axios, no Lodash) to prevent supply chain attacks.
- **Secret Masking**: Keys are automatically masked in logs and debug dumps.
- **Memory Protection**: Webhook payloads are capped at 1 MB to prevent DoS.
- **Timing Attack Resistance**: Uses `crypto.timingSafeEqual` for signature verification.
- **Immutability**: Client configuration is frozen once initialized.
- **CRLF Guard**: Prevents HTTP header injection via malformed keys.
- **Replay Protection**: 5-minute timestamp tolerance on webhook signatures.

---

## API Resources

| Resource              | Description                                              |
|:----------------------|:---------------------------------------------------------|
| `haybtech.payments`   | Create, retrieve, list, and verify transactions          |
| `haybtech.refunds`    | Initiate full or partial refunds                         |
| `haybtech.payouts`    | Send funds to a mobile money wallet                      |
| `haybtech.webhooks`   | Manage notification endpoints programmatically           |

---

MIT License
# haybtech-js-sdk
