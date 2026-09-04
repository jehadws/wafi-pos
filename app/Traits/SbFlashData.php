<?php

namespace App\Traits;

trait SbFlashData
{
    protected $flashData = [];

    public function setData( $data )
    {
        $this->flashData = $data;
    }

    public function getData()
    {
        return $this->flashData;
    }
}
