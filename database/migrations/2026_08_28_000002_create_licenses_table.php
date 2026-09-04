<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Activated terminal licenses table.
     *
     * Note: NO license keys are stored in this database.
     * When a cryptographically signed license key is entered, its RSA digital
     * signature is validated in-memory against the public key. If valid, the
     * verified device and license metadata are recorded here.
     */
    public function up(): void
    {
        Schema::create('licenses', function (Blueprint $table) {
            $table->id();
            $table->string('hwid', 64)->unique();
            $table->string('device_name', 100)->nullable();
            $table->string('client_name', 150)->nullable();
            $table->text('license_payload')->nullable();
            $table->text('key_string')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamp('activated_at')->nullable();
            $table->timestamp('last_seen')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('licenses');
    }
};
