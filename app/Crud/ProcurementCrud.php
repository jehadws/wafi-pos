<?php

namespace App\Crud;

use App\Classes\FormInput;
use App\Exceptions\NotAllowedException;
use App\Http\Requests\ProcurementRequest;
use App\Models\Procurement;
use App\Models\Provider;
use App\Models\TaxGroup;
use App\Services\CrudEntry;
use App\Services\CrudService;
use App\Services\Helper;
use App\Services\ProcurementService;
use App\Services\ProviderService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\ValidationException;
use TorMorten\Eventy\Facades\Events as Hook;

class ProcurementCrud extends CrudService
{
  /**
   * Define the autoload status
   */
  const AUTOLOAD = true;

  /**
   * Define the identifier
   */
  const IDENTIFIER = 'sb.procurements';

  /**
   * define the base table
   */
  protected $table = 'subul_procurements';

  /**
   * Define namespace
   *
   * @param  string
   */
  protected $namespace = 'sb.procurements';
  public $to_route = 'sb.dashboard.procurement-list';

  /**
   * Model Used
   */
  protected $model = Procurement::class;

  /**
   * Adding relation
   */
  public $relations = [
    ['subul_users as users', 'subul_procurements.author', '=', 'users.id'],
    ['subul_providers as providers', 'subul_procurements.provider_id', '=', 'providers.id'],
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

  /**
   * The generic fill/save block is disabled: procurements are written
   * exclusively by ProcurementService (single transactional writer —
   * products + stock sync) from beforePost/beforePut. The root-level
   * "products" section is skipped for good measure.
   */
  public $disablePost = true;
  public $disablePut = true;
  public $skippable = ['products'];

  /**
   * define permission
   */
  public $permissions = [
    'create' => 'subul.create.procurements',
    'read' => 'subul.read.procurements',
    'update' => 'subul.update.procurements',
    'delete' => 'subul.delete.procurements',
  ];

  /**
   * @var ProviderService
   */
  protected $providerService;

  /**
   * Define Constructor
   */
  public function __construct()
  {
    parent::__construct();

    $this->providerService = app()->make(ProviderService::class);
  }

  /**
   * Return the label used for the crud
   * instance
   *
   * @return array
   **/
  public function getLabels()
  {
    return [
      'list_title' => __('Procurements List'),
      'list_description' => __('Display all procurements.'),
      'no_entry' => __('No procurements has been registered'),
      'create_new' => __('Add a new procurement'),
      'create_title' => __('Create a new procurement'),
      'create_description' => __('Register a new procurement and save it.'),
      'edit_title' => __('Edit procurement'),
      'edit_description' => __('Modify  Procurement.'),
      'back_to_list' => __('Return to Procurements'),
    ];
  }

  public function hook($query): void
  {
    /**
     * should not block default
     * crud sorting
     */
    if (! request()->query('active') && ! request()->query('direction')) {
      $query->orderBy('created_at', 'desc');
    }
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
    /**
     * On edit, the products rows are seeded from the same source the
     * dedicated edit page used (ProcurementController::updateProcurement
     * passes `procurement.load('products')`). The client adds `_key` /
     * `$invalid` per row; they are stripped server-side on submit.
     */
    $products = $entry instanceof Procurement
      ? $entry->products->toArray()
      : [];

    return [
      'main' => FormInput::text(
        label: __('Name'),
        name: 'name',
        value: $entry->name ?? '',
        validation: 'nullable|string|max:255',
        description: __('Provide a name that will help to identify the procurement.'),
      ),

      /**
       * Root-level section consumed by the `procurementProducts` custom
       * field (Phase 2 of docs/plans/backend-driven-completion): rows are
       * seeded under "value", the tax groups drive the tax modals.
       * Lives outside "tabs" so it cannot collide with a field name.
       */
      'products' => [
        'component' => 'procurementProducts',
        'taxGroups' => TaxGroup::with('taxes:id,tax_group_id,rate')->get()->toArray(),
        'value' => $products,
      ],

      'tabs' => [
        'general' => [
          'label' => __('General'),
          'fields' => [
            FormInput::text(
              label: __('Invoice Number'),
              name: 'invoice_reference',
              value: $entry->invoice_reference ?? '',
              validation: 'nullable|string|max:255',
              description: __('If the procurement has been issued outside of Subul, please provide a unique reference.'),
            ),
            FormInput::date(
              label: __('Delivery Time'),
              name: 'delivery_time',
              value: $entry->delivery_time ?? sb()->date->now()->format('Y-m-d'),
              description: __('If the procurement has to be delivered at a specific time, define the moment here.'),
            ),
            FormInput::date(
              label: __('Invoice Date'),
              name: 'invoice_date',
              value: $entry->invoice_date ?? sb()->date->now()->format('Y-m-d'),
              description: __('If you would like to define a custom invoice date.'),
            ),
            FormInput::switch(
              label: __('Automatic Approval'),
              name: 'automatic_approval',
              options: Helper::kvToJsOptions([
                0 => __('No'),
                1 => __('Yes'),
              ]),
              value: $entry->automatic_approval ?? 1,
              validation: 'nullable|boolean',
              description: __('Determine if the procurement should be marked automatically as approved once the Delivery Time occurs.'),
            ),
            FormInput::select(
              label: __('Delivery Status'),
              name: 'delivery_status',
              options: Helper::kvToJsOptions([
                'pending' => __('Pending'),
                'delivered' => __('Delivered'),
                'draft' => __('Draft'),
              ]),
              value: $entry->delivery_status ?? 'delivered',
              validation: 'required|in:delivered,pending,draft',
              description: __('Determine what is the actual value of the procurement. Once "Delivered" the status can\'t be changed, and the stock will be updated.'),
            ),
            FormInput::select(
              label: __('Payment Status'),
              name: 'payment_status',
              options: Helper::kvToJsOptions([
                'unpaid' => __('Unpaid'),
                'paid' => __('Paid'),
              ]),
              value: $entry->payment_status ?? 'paid',
              validation: 'required|in:unpaid,paid',
              description: __('Determine what is the actual payment status of the procurement.'),
            ),
            FormInput::searchSelect(
              label: __('Provider'),
              name: 'provider_id',
              value: $entry->provider_id ?? '',
              options: Helper::toJsOptions(Provider::get(), ['id', 'first_name']),
              validation: 'required',
              description: __('Determine what is the actual provider of the current procurement.'),
              component: 'sbCrudForm',
              props: ProviderCrud::getFormConfig(),
            ),
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
    if (empty($inputs['invoice_date'])) {
      $inputs['invoice_date'] = sb()->date->toDateTimeString();
    }

    return $inputs;
  }

  /**
   * Filter PUT input fields
   *
   * @param  array of fields
   * @return array of fields
   */
  public function filterPutInputs($inputs, Procurement $entry)
  {
    if (empty($inputs['invoice_date'])) {
      $inputs['invoice_date'] = sb()->date->toDateTimeString();
    }

    return $inputs;
  }

  /**
   * Reshape the flat inputs produced by SbForms::getPlainData
   * (`{ name, general.* fields, products }`) into the nested shape
   * ProcurementService::create/edit consume:
   * `{ name, general: {…7 whitelisted fields…}, products: [...] }`.
   * Client-only row keys (`_key`, `$invalid`) are stripped here.
   */
  private function toServicePayload(array $inputs): array
  {
    return [
      'name' => $inputs['name'] ?? '',

      'general' => collect($inputs)->only([
        'provider_id',
        'delivery_status',
        'payment_status',
        'invoice_reference',
        'delivery_time',
        'invoice_date',
        'automatic_approval',
      ])->all(),

      'products' => collect($inputs['products'] ?? [])
        ->map(fn ($row) => collect($row)->except(['_key', '$invalid'])->all())
        ->values()
        ->all(),
    ];
  }

  /**
   * Before saving a record — delegate the whole write to
   * ProcurementService::create (single transactional writer). The
   * generic fill/save block is disabled (disablePost) so this is
   * the only place a procurement is written on the crud path.
   *
   * @param  array $inputs flat inputs from SbForms::getPlainData
   * @return void
   */
  public function beforePost($inputs, $entry = null, $filtered = [])
  {
    $this->allowedTo('create');

    $payload = $this->toServicePayload($inputs);

    /**
     * Double validation is intentional: CrudPostRequest already
     * validated the general.* rules extracted from the form
     * definition; this re-checks them (identical rules) and adds
     * the per-row rules the form definition cannot express.
     * ValidationException keys land as `general.{name}` / `products.{i}.{name}`.
     */
    Validator::make($payload, app(ProcurementRequest::class)->rules())->validate();

    app(ProcurementService::class)->create($payload);
  }

  /**
   * After saving a record
   *
   * @param  Request $request
   * @return void
   */
  public function afterPost($request, Procurement $entry)
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
   * Before updating a record — delegate the whole write to
   * ProcurementService::edit (single transactional writer). The
   * generic fill/save block is disabled (disablePut).
   *
   * @param  array  $inputs flat inputs from SbForms::getPlainData
   * @param  object $entry
   * @return void
   */
  public function beforePut($inputs, $entry = null, $filtered = [])
  {
    $this->allowedTo('update');

    /**
     * Same guard as ProcurementController::edit — a stocked procurement
     * is frozen (its stock has already been synced). Surfaced as a
     * validation error on general.delivery_status (422, not 500), so the
     * ProcurementService internal guard never produces an unhandled 500.
     */
    if ($entry instanceof Procurement && $entry->delivery_status === Procurement::STOCKED) {
      throw ValidationException::withMessages([
        'general.delivery_status' => __('Unable to edit a procurement that is stocked. Consider performing an adjustment or either delete the procurement.'),
      ]);
    }

    $payload = $this->toServicePayload($inputs);

    /**
     * Row rules + the general.* whitelist re-checked server-side —
     * see beforePost for why the double validation is intentional.
     */
    Validator::make($payload, app(ProcurementRequest::class)->rules())->validate();

    app(ProcurementService::class)->edit($entry->id, $payload);
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
    if ($namespace == 'sb.procurements') {
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
      'providers_first_name' => [
        'label' => __('Provider'),
        '$direction' => '',
        '$sort' => false,
      ],
      'delivery_status' => [
        'label' => __('Delivery Status'),
        '$direction' => '',
        '$sort' => false,
      ],
      'payment_status' => [
        'label' => __('Payment Status'),
        '$direction' => '',
        '$sort' => false,
      ],
      'invoice_date' => [
        'label' => __('Invoice Date'),
        '$direction' => '',
        '$sort' => false,
      ],
      'value' => [
        'label' => __('Sale Value'),
        '$direction' => '',
        'width' => '150px',
        '$sort' => false,
      ],
      'cost' => [
        'label' => __('Purchase Value'),
        '$direction' => '',
        'width' => '150px',
        '$sort' => false,
      ],
      'tax_value' => [
        'label' => __('Taxes'),
        '$direction' => '',
        '$sort' => false,
      ],
      'users_username' => [
        'label' => __('Author'),
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
    $entry->delivery_status = $this->providerService->getDeliveryStatusLabel($entry->delivery_status);
    $entry->payment_status = $this->providerService->getPaymentStatusLabel($entry->payment_status);

    $entry->value = sb()
      ->currency
      ->define($entry->value)
      ->format();

    $entry->cost = sb()
      ->currency
      ->define($entry->cost)
      ->format();

    $entry->tax_value = sb()
      ->currency
      ->define($entry->tax_value)
      ->format();

    $entry->action(
      identifier: 'edit',
      label: __('Edit'),
      type: 'GOTO',
      url: sb()->url('/dashboard/' . 'procurements' . '/edit/' . $entry->id)
    );

    $entry->action(
      identifier: 'invoice', // Assuming you want to replace 'namespace' with 'identifier'
      label: __('Invoice'),
      type: 'GOTO',
      url: sb()->url('/dashboard/' . 'procurements' . '/edit/' . $entry->id . '/invoice')
    );

    /**
     * if the procurement payment status
     * is not paid, we can display new option for making a payment
     */
    if ($entry->payment_status !== Procurement::PAYMENT_PAID) {
      $entry->action(
        identifier: 'set_paid', // Hypothetical - please verify if this is accurate
        label: __('Set Paid'),
        type: 'GET',
        url: sb()->url('/api/procurements/' . $entry->id . '/set-as-paid'),
        confirm: [
          'message' => __('Would you like to mark this procurement as paid?'),
        ]
      );
    }

    $entry->action(
      identifier: 'refresh',
      label: __('Refresh'),
      type: 'GET',
      url: sb()->url('/api/procurements/' . $entry->id . '/refresh'),
      confirm: [
        'message' => __('Would you like to refresh this ?'),
      ]
    );

    $entry->action(
      identifier: 'delete',
      label: __('Delete'),
      type: 'DELETE',
      url: sb()->url('/api/crud/sb.procurements/' . $entry->id),
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
    if ($request->input('action') == 'delete_selected') {
      /**
       * Will control if the user has the permissoin to do that.
       */
      if ($this->permissions['delete'] !== false) {
        sb()->restrict($this->permissions['delete']);
      } else {
        throw new NotAllowedException;
      }

      $status = [
        'success' => 0,
        'error' => 0,
      ];

      foreach ($request->input('entries') as $id) {
        $entity = $this->model::find($id);
        if ($entity instanceof Procurement) {
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
      'list' => 'procurements',
      'create' => 'procurements/create',
      'edit' => 'procurements/edit',
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
