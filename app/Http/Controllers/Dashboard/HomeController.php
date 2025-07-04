<?php

/**
 * JgremPOS Controller
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

    return  Inertia::render('welcome', [
      'title' => sprintf(
        __('Welcome &mdash; %s'),
        ns()->option->get('ns_store_name', 'JgremPOS ' . config('jgrem.version'))
      ),
    ]);
  }
}
