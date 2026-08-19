/**
 * Job Tracker & Idempotency Cache
 * Prevents accidental double printing caused by rapid double clicks on cashier UI.
 * Retains job status and print history in memory.
 */

class JobTracker {
    constructor(ttlMs = 10 * 60 * 1000) { // 10 minutes cache
        this.jobs = new Map();
        this.ttlMs = ttlMs;
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
        this.jobs.set(jobId, {
            id: jobId,
            timestamp: Date.now(),
            status: 'processing',
            details
        });
        this.cleanExpired();
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
