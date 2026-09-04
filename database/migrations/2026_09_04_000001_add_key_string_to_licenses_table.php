<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Add the original signed key string to the licenses table.
     *
     * This column stores the raw "Base64Url(Payload).Base64Url(Signature)" token
     * so that the RSA-SHA256 signature can be re-verified at middleware runtime.
     * Without this, any database row with is_active=1 would bypass activation.
     */
    public function up(): void
    {
        if (Schema::hasTable('licenses') && !Schema::hasColumn('licenses', 'key_string')) {
            Schema::table('licenses', function (Blueprint $table) {
                $table->text('key_string')->nullable()->after('license_payload');
            });
        }
    }

    public function down(): void
    {
        Schema::table('licenses', function (Blueprint $table) {
            $table->dropColumn('key_string');
        });
    }
};
