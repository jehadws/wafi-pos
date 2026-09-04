<?php

namespace App\Jobs;

use App\Services\ReportService;
use App\Traits\SbSerialize;
use Carbon\Carbon;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;

class RefreshReportJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, SbSerialize, Queueable;

    /**
     * Create a new job instance.
     *
     * @return void
     */
    public function __construct( public Carbon $date )
    {
        $this->prepareSerialization();
    }

    /**
     * Execute the job.
     *
     * @return void
     */
    public function handle( ReportService $reportService )
    {
        $date = Carbon::parse( $this->date );

        $reportService->computeDayReport(
            dateStart: $date->startOfDay()->toDateTimeString(),
            dateEnd: $date->endOfDay()->toDateTimeString()
        );
    }
}
