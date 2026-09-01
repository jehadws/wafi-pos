/**
 * Job Tracker & Idempotency Cache
 * Prevents accidental double printing caused by rapid double clicks on cashier UI.
 * Retains job status and print history in memory with automated memory bounds.
 */

class JobTracker {
    constructor(ttlMs = 10 * 60 * 1000, maxEntries = 1000) {
        this.jobs = new Map();
        this.ttlMs = ttlMs;
        this.maxEntries = maxEntries;

        // Periodic background cleanup every 5 minutes
        if (typeof setInterval !== 'undefined') {
            const timer = setInterval(() => this.cleanExpired(), 5 * 60 * 1000);
            if (timer.unref) timer.unref();
        }
    }

    /**
     * Check if a job ID was already processed recently
     */
    isDuplicate(jobId) {
        if (!jobId) return false;
        const record = this.jobs.get(jobId);
        if (!record) return false;

        // If older than TTL, expire it
        if (Date.now() - record.timestamp > this.ttlMs) {
            this.jobs.delete(jobId);
            return false;
        }

        return true;
    }

    /**
     * Register a new print job
     */
    register(jobId, details = {}) {
        if (!jobId) return;

        // Enforce maximum cache bounds (evict oldest)
        if (this.jobs.size >= this.maxEntries) {
            const oldestKey = this.jobs.keys().next().value;
            if (oldestKey) this.jobs.delete(oldestKey);
        }

        this.jobs.set(jobId, {
            id: jobId,
            timestamp: Date.now(),
            status: 'processing',
            details
        });
    }

    /**
     * Mark job as completed
     */
    complete(jobId, result = {}) {
        if (!jobId) return;
        const record = this.jobs.get(jobId);
        if (record) {
            record.status = 'completed';
            record.completedAt = Date.now();
            record.result = result;
        }
    }

    /**
     * Mark job as failed
     */
    fail(jobId, error) {
        if (!jobId) return;
        const record = this.jobs.get(jobId);
        if (record) {
            record.status = 'failed';
            record.error = error?.message || String(error);
        }
    }

    /**
     * Clean up records older than TTL
     */
    cleanExpired() {
        const now = Date.now();
        for (const [id, record] of this.jobs.entries()) {
            if (now - record.timestamp > this.ttlMs) {
                this.jobs.delete(id);
            }
        }
    }
}

module.exports = new JobTracker();
