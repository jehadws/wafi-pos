<?php

namespace App\Traits;

use App\Events\JobBeforeSerializeEvent;
use App\Jobs\Middleware\UnserializeMiddleware;
use Modules\SbMultiStore\Models\Store;

trait SbSerialize
{
    public $attributes;

    public Store $store;

    protected function prepareSerialization()
    {
        JobBeforeSerializeEvent::dispatch( $this );
    }

    public function middleware()
    {
        return [
            UnserializeMiddleware::class,
        ];
    }
}
