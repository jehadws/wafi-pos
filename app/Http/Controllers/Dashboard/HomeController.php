<?php

/**
 * Subul Controller
 *
 * @since  1.0
 **/

namespace App\Http\Controllers\Dashboard;

use App\Http\Controllers\DashboardController;
use Inertia\Inertia;

class HomeController extends DashboardController
{
  public function welcome()
  {
    if (! \App\Services\Helper::installed()) {
      return redirect()->route('setup.index');
    }

    return  Inertia::render('welcome', [
      'title' => sprintf(
        __('Welcome &mdash; %s'),
        sb()->option->get('sb_store_name', 'Subul ' . config('subul.version'))
      ),
    ]);
  }
}
