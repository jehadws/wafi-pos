<?php

namespace App\Crud;

use App\Models\TaxGroup;
use App\Services\CrudEntry;
use App\Services\CrudService;
use App\Services\UsersService;
use Illuminate\Http\Request;
use TorMorten\Eventy\Facades\Events as Hook;

class TaxesGroupCrud extends CrudService
{
  /**
   * Define the autoload status
   */
  const AUTOLOAD = true;

  /**
   * Define the identifier
   */
  const IDENTIFIER = 'sb.taxes-groups';

  /**
   * define the base table
   */
  protected $table = 'subul_taxes_groups';

  /**
   * base route name
   */
  protected $mainRoute = 'sb.taxes-groups';

  /**
   * Define namespace
   *
   * @param  string
   */
  protected $namespace = 'sb.taxes-groups';

  /**
   * Model Used
   */
  protected $model = TaxGroup::class;

  /**
   * Adding relation
   */
  public $relations = [
    ['subul_users as user', 'subul_taxes_groups.author', '=', 'user.id'],
  ];

  /**
   * Define where statement
   *
   * @var array
   **/
  protected $listWhere = [];

  /**
   * Define where in statement
   *
   * @var array
   */
  protected $whereIn = [];

  /**
   * Fields which will be filled during post/put
   */
  public $fillable = [];

  public $to_route = 'sb.dashboard.taxes.groups';

  /**
   * Define Constructor
   */
  public function __construct()
  {
    parent::__construct();
  }

  protected $permissions = [
    'create' => 'subul.create.taxes',
    'read' => 'subul.read.taxes',
    'update' => 'subul.update.taxes',
    'delete' => 'subul.delete.taxes',
  ];

  /**
   * Return the label used for the crud
   * instance
   *
   * @return array
   **/
  public function getLabels()
  {
    return [
      'list_title' => __('Taxes Groups List'),
      'list_description' => __('Display all taxes groups.'),
      'no_entry' => __('No taxes groups has been registered'),
      'create_new' => __('Add a new tax group'),
      'create_title' => __('Create a new tax group'),
      'create_description' => __('Register a new tax group and save it.'),
      'edit_title' => __('Edit tax group'),
      'edit_description' => __('Modify  Tax Group.'),
      'back_to_list' => __('Return to Taxes Groups'),
    ];
  }

  /**
   * Check whether a feature is enabled
   *
   **/
  public function isEnabled($feature): bool
  {
    return false; // by default
  }

  /**
   * Fields
   *
   * @param  object/null
   * @return array of field
   */
  public function getForm($entry = null)
  {
    return [
      'main' => [
        'label' => __('Name'),
        'name' => 'name',
        'value' => $entry->name ?? '',
        'validation' => 'required',
        'description' => __('Provide a name to the resource.'),
      ],
      'tabs' => [
        'general' => [
          'label' => __('General'),
          'fields' => [
            [
              'name' => 'description',
              'type' => 'textarea',
              'value' => $entry->description ?? '',
              'label' => __('Description'),
              'description' => __('Provide a short description to the tax group.'),
            ],
          ],
        ],
      ],
    ];
  }

  /**
   * Filter POST input fields
   *
   * @param  array of fields
   * @return array of fields
   */
  public function filterPostInputs($inputs)
  {
    return $inputs;
  }

  /**
   * Filter PUT input fields
   *
   * @param  array of fields
   * @return array of fields
   */
  public function filterPutInputs($inputs, TaxGroup $entry)
  {
    return $inputs;
  }

  /**
   * Before saving a record
   *
   * @param  Request $request
   * @return void
   */
  public function beforePost($request)
  {
    $this->allowedTo('create');

    return $request;
  }

  /**
   * After saving a record
   *
   * @param  Request $request
   * @return void
   */
  public function afterPost($request, TaxGroup $entry)
  {
    return $request;
  }

  /**
   * get
   *
   * @param  string
   * @return mixed
   */
  public function get($param)
  {
    switch ($param) {
      case 'model':
        return $this->model;
        break;
    }
  }

  /**
   * Before updating a record
   *
   * @param Request $request
   * @param  object entry
   * @return void
   */
  public function beforePut($request, $entry)
  {
    $this->allowedTo('update');

    return $request;
  }

  /**
   * After updating a record
   *
   * @param Request $request
   * @param  object entry
   * @return void
   */
  public function afterPut($request, $entry)
  {
    return $request;
  }

  /**
   * Before Delete
   *
   * @return void
   */
  public function beforeDelete($namespace, $id, $model)
  {
    if ($namespace == 'sb.taxes-groups') {
      $this->allowedTo('delete');
    }
  }

  /**
   * Define Columns
   */
  public function getColumns(): array
  {
    return [
      'name' => [
        'label' => __('Name'),
        '$direction' => '',
        '$sort' => false,
      ],
      'user_username' => [
        'label' => __('Author'),
        '$direction' => '',
        '$sort' => false,
      ],
      'created_at' => [
        'label' => __('Created At'),
        '$direction' => '',
        '$sort' => false,
      ],
    ];
  }

  /**
   * Define actions
   */
  public function setActions(CrudEntry $entry): CrudEntry
  {
    // you can make changes here
    $entry->action(
      identifier: 'edit',
      label: __('Edit'),
      type: 'GOTO',
      url: sb()->url('/dashboard/' . 'taxes/groups' . '/edit/' . $entry->id)
    );

    $entry->action(
      identifier: 'delete',
      label: __('Delete'),
      type: 'DELETE',
      url: sb()->url('/api/crud/sb.taxes-groups/' . $entry->id),
      confirm: [
        'title' => __('Confirm Your Action'),
        'message' => __('Would you like to delete this ?'),
      ]
    );

    return $entry;
  }

  /**
   * Bulk Delete Action
   *
   * @param    object Request with object
   * @return  false/array
   */
  public function bulkAction(Request $request)
  {
    /**
     * Deleting licence is only allowed for admin
     * and supervisor.
     */
    $user = app()->make(UsersService::class);
    if (! $user->is(['admin', 'supervisor'])) {
      return response()->json([
        'status' => 'error',
        'message' => __('You\'re not allowed to do this operation'),
      ], 403);
    }

    if ($request->input('action') == 'delete_selected') {
      $status = [
        'success' => 0,
        'error' => 0,
      ];

      foreach ($request->input('entries') as $id) {
        $entity = $this->model::find($id);
        if ($entity instanceof TaxGroup) {
          $entity->delete();
          $status['success']++;
        } else {
          $status['error']++;
        }
      }

      return $status;
    }

    return Hook::filter($this->namespace . '-catch-action', false, $request);
  }

  /**
   * get Links
   *
   * @return array of links
   */
  public function getLinks(): array
  {
    return [
      'list' => sb()->url('dashboard/' . 'taxes/groups'),
      'create' => sb()->url('dashboard/' . 'taxes/groups/create'),
      'edit' => sb()->url('dashboard/' . 'taxes/groups/edit/{id}'),
      'post' => sb()->url('api/crud/' . 'sb.taxes-groups'),
      'put' => sb()->url('api/crud/' . 'sb.taxes-groups/' . '{id}'),
    ];
  }

  /**
   * Get Bulk actions
   *
   * @return array of actions
   **/
  public function getBulkActions(): array
  {
    return Hook::filter($this->namespace . '-bulk', [
      [
        'label' => __('Delete Selected Groups'),
        'identifier' => 'delete_selected',
        'url' => sb()->route('sb.api.crud-bulk-actions', [
          'namespace' => $this->namespace,
        ]),
      ],
    ]);
  }

  /**
   * get exports
   *
   * @return array of export formats
   **/
  public function getExports()
  {
    return [];
  }
}
