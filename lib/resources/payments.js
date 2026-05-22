'use strict';

/**
 * Payments resource.
 */
class Payments {
    constructor(client) {
        this.client = client;
    }

    /**
     * Create a new payment transaction.
     * @param {Object} params 
     * @param {string} idempotencyKey - Optional unique key to prevent duplicate charges
     */
    async create(params, idempotencyKey = '') {
        const headers = idempotencyKey ? { 'Idempotency-Key': idempotencyKey } : {};
        const response = await this.client.request('POST', 'payments', params, headers);
        
        // Add a helper for redirection
        return Object.assign(response, {
            redirect: (res) => {
                const url = response.data?.payment_url;
                if (!url) return false;
                
                if (res && typeof res.redirect === 'function') {
                    // Express.js / Fastify style
                    res.redirect(url);
                } else if (typeof window !== 'undefined') {
                    // Browser style (though not recommended for server SDK)
                    window.location.href = url;
                }
                return true;
            }
        });
    }

    /**
     * Retrieve a transaction by ID or merchant_ref.
     */
    async retrieve(id) {
        return this.client.request('GET', `payments/${id}`);
    }

    /**
     * List transactions with optional filters.
     */
    async list(params = {}) {
        const query = new URLSearchParams(params).toString();
        const path = query ? `payments?${query}` : 'payments';
        return this.client.request('GET', path);
    }

    /**
     * Reconcile status with upstream PSP.
     */
    async verify(id) {
        return this.client.request('POST', `payments/${id}/verify`);
    }
}

module.exports = Payments;
