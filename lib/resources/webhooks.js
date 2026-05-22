'use strict';

/**
 * Webhooks management resource.
 */
class Webhooks {
    constructor(client) {
        this.client = client;
    }

    async all() {
        return this.client.request('GET', 'webhooks');
    }

    async create(params) {
        return this.client.request('POST', 'webhooks', params);
    }

    async reveal(id, otp = null) {
        const body = otp ? { otp } : {};
        return this.client.request('POST', `webhooks/${id}/reveal`, body);
    }

    async rotate(id, otp = null) {
        const body = otp ? { otp } : {};
        return this.client.request('POST', `webhooks/${id}/rotate`, body);
    }

    async test(id) {
        return this.client.request('POST', `webhooks/${id}/test`);
    }

    async delete(id, otp = null) {
        // Since our native client doesn't support body in DELETE easily, 
        // we use X-OTP header if present.
        const headers = otp ? { 'X-OTP': otp } : {};
        return this.client.request('DELETE', `webhooks/${id}`, null, headers);
    }
}

module.exports = Webhooks;
