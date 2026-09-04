<?php

/**
 * Subul Controller
 *
 * @since  1.0
 **/

namespace App\Http\Controllers\Dashboard;

use App\Crud\UnitCrud;
use App\Crud\UnitGroupCrud;
use App\Http\Controllers\DashboardController;
use App\Http\Requests\UnitRequest;
// use App\Http\Requests\UnitsGroupsRequest;
use App\Models\Unit;
use App\Models\UnitGroup;
use App\Models\User;
use App\Services\DateService;
use App\Services\UnitService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\View;
use Inertia\Inertia;

class UnitsController extends DashboardController
{
  public function __construct(
    protected UnitService $unitService,
    protected DateService $dateService
  ) {
    // ...
  }

  public function postGroup(Request $request)
  {
    $result = $this->unitService->createGroup($request->all());
    return redirect()->route('sb.dashboard.units.groups')->with('success', 'Unit Group created successfully');
  }

  public function putGroup(Request $request, $id)
  {
    return $this->unitService->updateGroup($id, $request->only(['name', 'description']));
  }

  /**
   * Create a new unit
   *
   * @param Request
   * @return AsyncResponse
   */
  public function postUnit(Request $request)
  {
    $result =  $this->unitService->createUnit($request->only(['name', 'description', 'group_id', 'value', 'base_unit', 'identifier']));
    return redirect()->route('sb.dashboard.units')->with('success', 'Unit created successfully');
  }

  public function deleteUnitGroup($id)
  {
    return $this->unitService->deleteCategory($id);
  }

  public function deleteUnit($id)
  {
    return $this->unitService->deleteUnit($id);
  }

  public function get($id = null)
  {
    return $this->unitService->get($id);
  }

  public function getSiblingUnits(Unit $id)
  {
    return $this->unitService->getSiblingUnits(
      unit: $id
    );
  }

  /**
   * get all units assigned to a specified group
   *
   * @param int group id
   * @return array
   */
  public function getGroupUnits($id)
  {
    return $this->unitService->getGroups($id)->units;
  }

  /**
   * Get group units using a specific id
   *
   * @param int group id
   * @return array or units
   */
  public function getGroups()
  {
    return $this->unitService->getGroups();
  }

  /**
   * Edit a unit using provided
   * informations
   *
   * @param Request
   * @param int unit id
   * @return json
   */
  public function putUnit(UnitRequest $request, $id)
  {
    return $this->unitService->updateUnit(
      $id,
      $request->only(['name', 'description', 'group_id', 'value', 'base_unit'])
    );
  }

  /**
   * retrieve a group of a
   * specific unit using an id
   *
   * @param int Parent Group
   * @return json
   */
  public function getUnitParentGroup($id)
  {
    return $this->unitService->getUnitParentGroup($id);
  }

  public function listUnitsGroups()
  {
    sb()->restrict(['subul.read.products-units']);
    $units =  UnitGroup::get();
    return Inertia::render('dashboard/units/groups/page', [
      'title' => __('Dashboard'),
      'unitGroups' => $units
    ]);

    // return UnitGroupCrud::table();
  }

  public function listUnits()
  {
    sb()->restrict(['subul.read.products-units']);

    $units =  Unit::addSelect([
      'author_name' => User::select('username')
        ->whereColumn('subul_users.id', 'author')
        ->limit(1),
      'group_name' => UnitGroup::select('name')
        ->whereColumn('subul_units_groups.id', 'group_id')
        ->limit(1),
    ])->get();
    return Inertia::render('dashboard/units/page', [
      'title' => __('Dashboard'),
      'units' => $units
    ]);

    // return UnitCrud::table();
  }

  public function createUnitGroup()
  {
    sb()->restrict(['subul.create.products-units']);

    return Inertia::render('dashboard/units/groups/create');

    // return UnitGroupCrud::form();
  }

  /**
   * Edit existing unit group
   *
   * @return View
   */
  public function editUnitGroup(UnitGroup $group)
  {
    sb()->restrict(['subul.update.products-units']);

    return Inertia::render('dashboard/units/groups/edit', [
      'group' => $group
    ]);
    // return UnitGroupCrud::form($group);
  }

  public function createUnit()
  {
    sb()->restrict(['subul.create.products-units']);

    $unitGroups = UnitGroup::get();

    return Inertia::render('dashboard/units/create', [
      'unitGroups' => $unitGroups
    ]);
    // return UnitCrud::form();
  }

  public function editUnit(Unit $unit)
  {
    sb()->restrict(['subul.update.products-units']);
    $unitGroups = UnitGroup::get();

    return Inertia::render('dashboard/units/edit', [
      'groups' => $unitGroups,
      'unit' => $unit
    ]);
    // return UnitCrud::form($unit);
  }
}
