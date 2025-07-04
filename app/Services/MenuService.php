<?php

namespace App\Services;

use Illuminate\Support\Facades\Gate;
use TorMorten\Eventy\Facades\Eventy as Hook;

class MenuService
{
  protected $menus;

  public function buildMenus()
  {
    $this->menus = [
      'dashboard' => [
        'label' => __('Dashboard'),
        'permissions' => ['read.dashboard'],
        'href' => ns()->url('/dashboard'),
        'icon' => 'Home',
      ],
      'pos' => [
        'label' => __('POS'),
        'icon' => 'ShoppingCart',
        'permissions' => ['jgrem.create.orders'],
        'href' => ns()->url('/dashboard/pos'),
      ],
      'orders' => [
        'label' => __('Orders'),
        'permissions' => ['jgrem.read.orders'],
        'icon' => 'ListOrdered',
        'childrens' => [
          'order-list' => [
            'label' => __('Orders List'),
            'href' => ns()->url('/dashboard/orders'),
            'permissions' => ['jgrem.read.orders'],
          ],
          'payment-type' => [
            'label' => __('Payment Types'),
            'href' => ns()->url('/dashboard/orders/payments-types'),
            'permissions' => ['jgrem.manage-payments-types'],
          ],
        ],
      ],
      'medias' => [
        'label' => __('Medias'),
        'permissions' => ['jgrem.upload.medias', 'jgrem.see.medias'],
        'icon' => 'FileImage',
        'href' => ns()->url('/dashboard/medias'),
      ],
      'customers' => [
        'label' => __('Customers'),
        'permissions' => [
          'jgrem.read.customers',
          'jgrem.create.customers',
          'jgrem.read.customers-groups',
          'jgrem.create.customers-groups',
          'jgrem.import.customers',
          'jgrem.read.rewards',
          'jgrem.create.rewards',
          'jgrem.read.coupons',
          'jgrem.create.coupons',
        ],
        'icon' => 'Users',
        'childrens' => [
          'customers' => [
            'label' => __('List'),
            'permissions' => ['jgrem.read.customers'],
            'href' => ns()->url('/dashboard/customers'),
          ],
          'create-customer' => [
            'label' => __('Create Customer'),
            'permissions' => ['jgrem.create.customers'],
            'href' => ns()->url('/dashboard/customers/create'),
          ],
          'customers-groups' => [
            'label' => __('Customers Groups'),
            'permissions' => ['jgrem.read.customers-groups'],
            'href' => ns()->url('/dashboard/customers/groups'),
          ],
          'create-customers-group' => [
            'label' => __('Create Group'),
            'permissions' => ['jgrem.create.customers-groups'],
            'href' => ns()->url('/dashboard/customers/groups/create'),
          ],
          'list-reward-system' => [
            'label' => __('Reward Systems'),
            'permissions' => ['jgrem.read.rewards'],
            'href' => ns()->url('/dashboard/customers/rewards-system'),
          ],
          'create-reward-system' => [
            'label' => __('Create Reward'),
            'permissions' => ['jgrem.create.rewards'],
            'href' => ns()->url('/dashboard/customers/rewards-system/create'),
          ],
          'list-coupons' => [
            'label' => __('List Coupons'),
            'permissions' => ['jgrem.read.coupons'],
            'href' => ns()->url('/dashboard/customers/coupons'),
          ],
          'create-coupons' => [
            'label' => __('Create Coupon'),
            'permissions' => ['jgrem.create.coupons'],
            'href' => ns()->url('/dashboard/customers/coupons/create'),
          ],
        ],
      ],
      'providers' => [
        'label' => __('Providers'),
        'icon' => 'User',
        'permissions' => [
          'jgrem.read.providers',
          'jgrem.create.providers',
        ],
        'childrens' => [
          'providers' => [
            'label' => __('List'),
            'permissions' => ['jgrem.read.providers'],
            'href' => ns()->url('/dashboard/providers'),
          ],
          'create-provider' => [
            'label' => __('Create A Provider'),
            'permissions' => ['jgrem.create.providers'],
            'href' => ns()->url('/dashboard/providers/create'),
          ],
        ],
      ],
      'accounting' => [
        'label' => __('Accounting'),
        'icon' => 'Layers',
        'permissions' => [
          'jgrem.read.transactions',
          'jgrem.create.transactions',
          'jgrem.read.transactions-account',
          'jgrem.create.transactions-account',
        ],
        'childrens' => [
          'transactions' => [
            'label' => __('Expenses'),
            'permissions' => ['jgrem.read.transactions'],
            'href' => ns()->url('/dashboard/accounting/transactions'),
          ],
          'create-transaction' => [
            'label' => __('Create Expense'),
            'permissions' => ['jgrem.create.transactions'],
            'href' => ns()->url('/dashboard/accounting/transactions/create'),
          ],
          'transactions-history' => [
            'label' => __('Transaction History'),
            'permissions' => ['jgrem.read.transactions-history'],
            'href' => ns()->url('/dashboard/accounting/transactions/history'),
          ],
          'transacations-rules' => [
            'label' => __('Rules'),
            'permissions' => ['jgrem.create.transactions'],
            'href' => ns()->url('/dashboard/accounting/rules'),
          ],
          'transactions-account' => [
            'label' => __('Accounts'),
            'permissions' => ['jgrem.read.transactions-account'],
            'href' => ns()->url('/dashboard/accounting/accounts'),
          ],
          'create-transactions-account' => [
            'label' => __('Create Account'),
            'permissions' => ['jgrem.create.transactions-account'],
            'href' => ns()->url('/dashboard/accounting/accounts/create'),
          ],
        ],
      ],
      'inventory' => [
        'label' => __('Inventory'),
        'icon' => 'Package',
        'permissions' => [
          'jgrem.read.products',
          'jgrem.create.products',
          'jgrem.read.categories',
          'jgrem.create.categories',
          'jgrem.read.products-units',
          'jgrem.create.products-units',
          'jgrem.read.products-units',
          'jgrem.create.products-units',
          'jgrem.make.products-adjustments',
        ],
        'childrens' => [
          'products' => [
            'label' => __('Products'),
            'permissions' => ['jgrem.read.products'],
            'href' => ns()->url('/dashboard/products'),
          ],
          'create-products' => [
            'label' => __('Create Product'),
            'permissions' => ['jgrem.create.products'],
            'href' => ns()->url('/dashboard/products/create'),
          ],
          'labels-printing' => [
            'label' => __('Print Labels'),
            'href' => ns()->url('/dashboard/products/print-labels'),
            'permissions' => ['jgrem.create.products-labels'],
          ],
          'categories' => [
            'label' => __('Categories'),
            'permissions' => ['jgrem.read.categories'],
            'href' => ns()->url('/dashboard/products/categories'),
          ],
          'create-categories' => [
            'label' => __('Create Category'),
            'permissions' => ['jgrem.create.categories'],
            'href' => ns()->url('/dashboard/products/categories/create'),
          ],
          'units' => [
            'label' => __('Units'),
            'permissions' => ['jgrem.read.products-units'],
            'href' => ns()->url('/dashboard/units'),
          ],
          'create-units' => [
            'label' => __('Create Unit'),
            'permissions' => ['jgrem.create.products-units'],
            'href' => ns()->url('/dashboard/units/create'),
          ],
          'unit-groups' => [
            'label' => __('Unit Groups'),
            'permissions' => ['jgrem.read.products-units'],
            'href' => ns()->url('/dashboard/units/groups'),
          ],
          'create-unit-groups' => [
            'label' => __('Create Unit Groups'),
            'permissions' => ['jgrem.create.products-units'],
            'href' => ns()->url('/dashboard/units/groups/create'),
          ],
          'stock-adjustment' => [
            'label' => __('Stock Adjustment'),
            'permissions' => ['jgrem.make.products-adjustments'],
            'href' => ns()->url('/dashboard/products/stock-adjustment'),
          ],
          'product-history' => [
            'label' => __('Stock Flow Records'),
            'permissions' => ['jgrem.read.products'],
            'href' => ns()->url('/dashboard/products/stock-flow-records'),
          ],
        ],
      ],
      'taxes' => [
        'label' => __('Taxes'),
        'icon' => 'FileText',
        'permissions' => [
          'jgrem.create.taxes',
          'jgrem.read.taxes',
          'jgrem.update.taxes',
          'jgrem.delete.taxes',
        ],
        'childrens' => [
          'taxes-groups' => [
            'label' => __('Taxes Groups'),
            'permissions' => ['jgrem.read.taxes'],
            'href' => ns()->url('/dashboard/taxes/groups'),
          ],
          'create-taxes-group' => [
            'label' => __('Create Tax Groups'),
            'permissions' => ['jgrem.create.taxes'],
            'href' => ns()->url('/dashboard/taxes/groups/create'),
          ],
          'taxes' => [
            'label' => __('Taxes'),
            'permissions' => ['jgrem.read.taxes'],
            'href' => ns()->url('/dashboard/taxes'),
          ],
          'create-tax' => [
            'label' => __('Create Tax'),
            'permissions' => ['jgrem.create.taxes'],
            'href' => ns()->url('/dashboard/taxes/create'),
          ],
        ],
      ],
      'modules' => [
        'label' => __('Modules'),
        'icon' => 'Plug',
        'permissions' => ['manage.modules'],
        'childrens' => [
          'modules' => [
            'label' => __('List'),
            'href' => ns()->url('/dashboard/modules'),
          ],
          'upload-module' => [
            'label' => __('Upload Module'),
            'href' => ns()->url('/dashboard/modules/upload'),
          ],
        ],
      ],
      'users' => [
        'label' => __('Users'),
        'icon' => 'Users',
        'childrens' => [
          'profile' => [
            'label' => __('My Profile'),
            'permissions' => ['manage.profile'],
            'href' => ns()->url('/dashboard/users/profile'),
          ],
          'users' => [
            'label' => __('Users List'),
            'permissions' => ['read.users'],
            'href' => ns()->url('/dashboard/users'),
          ],
          'create-user' => [
            'label' => __('Create User'),
            'permissions' => ['create.users'],
            'href' => ns()->url('/dashboard/users/create'),
          ],
        ],
      ],
      'roles' => [
        'label' => __('Roles'),
        'icon' => 'Shield',
        'permissions' => ['read.roles', 'create.roles', 'update.roles'],
        'childrens' => [
          'all-roles' => [
            'label' => __('Roles'),
            'permissions' => ['read.roles'],
            'href' => ns()->url('/dashboard/users/roles'),
          ],
          'create-role' => [
            'label' => __('Create Roles'),
            'permissions' => ['create.roles'],
            'href' => ns()->url('/dashboard/users/roles/create'),
          ],
          'permissions' => [
            'label' => __('Permissions Manager'),
            'permissions' => ['update.roles'],
            'href' => ns()->url('/dashboard/users/roles/permissions-manager'),
          ],
        ],
      ],
      'procurements' => [
        'label' => __('Procurements'),
        'icon' => 'Truck',
        'permissions' => ['jgrem.read.procurements', 'jgrem.create.procurements'],
        'childrens' => [
          'procurements' => [
            'label' => __('Procurements List'),
            'permissions' => ['jgrem.read.procurements'],
            'href' => ns()->url('/dashboard/procurements'),
          ],
          'procurements-create' => [
            'label' => __('New Procurement'),
            'permissions' => ['jgrem.create.procurements'],
            'href' => ns()->url('/dashboard/procurements/create'),
          ],
          'procurements-products' => [
            'label' => __('Products'),
            'permissions' => ['jgrem.update.procurements'],
            'href' => ns()->url('/dashboard/procurements/products'),
          ],
        ],
      ],
      'reports' => [
        'label' => __('Reports'),
        'icon' => 'BarChart3',
        'permissions' => [
          'jgrem.reports.sales',
          'jgrem.reports.best_sales',
          'jgrem.reports.transactions',
          'jgrem.reports.yearly',
          'jgrem.reports.customers',
          'jgrem.reports.inventory',
          'jgrem.reports.payment-types',
        ],
        'childrens' => [
          'sales' => [
            'label' => __('Sale Report'),
            'permissions' => ['jgrem.reports.sales'],
            'href' => ns()->url('/dashboard/reports/sales'),
          ],
          'products-report' => [
            'label' => __('Sales Progress'),
            'permissions' => ['jgrem.reports.products-report'],
            'href' => ns()->url('/dashboard/reports/sales-progress'),
          ],
          'customers-statement' => [
            'label' => __('Customers Statement'),
            'permissions' => ['jgrem.reports.customers-statement'],
            'href' => ns()->url('/dashboard/reports/customers-statement'),
          ],
          'low-stock' => [
            'label' => __('Stock Report'),
            'permissions' => ['jgrem.reports.low-stock'],
            'href' => ns()->url('/dashboard/reports/low-stock'),
          ],
          'stock-history' => [
            'label' => __('Stock History'),
            'permissions' => ['jgrem.reports.stock-history'],
            'href' => ns()->url('/dashboard/reports/stock-history'),
          ],
          'sold-stock' => [
            'label' => __('Sold Stock'),
            'href' => ns()->url('/dashboard/reports/sold-stock'),
          ],
          'profit' => [
            'label' => __('Incomes & Loosses'),
            'href' => ns()->url('/dashboard/reports/profit'),
          ],
          'transactions' => [
            'label' => __('Transactions'),
            'permissions' => ['jgrem.reports.transactions'],
            'href' => ns()->url('/dashboard/reports/transactions'),
          ],
          'annulal-sales' => [
            'label' => __('Annual Report'),
            'permissions' => ['jgrem.reports.yearly'],
            'href' => ns()->url('/dashboard/reports/annual-report'),
          ],
          'payment-types' => [
            'label' => __('Sales By Payments'),
            'permissions' => ['jgrem.reports.payment-types'],
            'href' => ns()->url('/dashboard/reports/payment-types'),
          ],
        ],
      ],
      'settings' => [
        'label' => __('Settings'),
        'icon' => 'Settings',
        'permissions' => ['manage.options'],
        'childrens' => [
          'general' => [
            'label' => __('General'),
            'href' => ns()->url('/dashboard/settings/general'),
          ],
          'pos' => [
            'label' => __('POS'),
            'href' => ns()->url('/dashboard/settings/pos'),
          ],
          'customers' => [
            'label' => __('Customers'),
            'href' => ns()->url('/dashboard/settings/customers'),
          ],
          'orders' => [
            'label' => __('Orders'),
            'href' => ns()->url('/dashboard/settings/orders'),
          ],
          'accounting' => [
            'label' => __('Accounting'),
            'href' => ns()->url('/dashboard/settings/accounting'),
          ],
          'reports' => [
            'label' => __('Reports'),
            'href' => ns()->url('/dashboard/settings/reports'),
          ],
          'invoices' => [
            'label' => __('Invoices'),
            'href' => ns()->url('/dashboard/settings/invoices'),
          ],
          'workers' => [
            'label' => __('Workers'),
            'href' => ns()->url('/dashboard/settings/workers'),
          ],
          'reset' => [
            'label' => __('Reset'),
            'href' => ns()->url('/dashboard/settings/reset'),
          ],
          'about' => [
            'label' => __('About'),
            'href' => ns()->url('/dashboard/settings/about'),
          ],
        ],
      ],
    ];
  }

  /**
   * returns the list of available menus
   *
   * @return array of menus
   */
  public function getMenus()
  {
    $this->buildMenus();
    $this->menus = Hook::filter('ns-dashboard-menus', $this->menus);
    $this->toggleActive();

    return collect($this->menus)->filter(function ($menu) {
      return ! isset($menu['permissions']) || Gate::any($menu['permissions']);
    })->map(function ($menu) {
      $menu['childrens'] = collect($menu['childrens'] ?? [])->filter(function ($submenu) {
        return ! isset($submenu['permissions']) || Gate::any($submenu['permissions']);
      })->toArray();

      return $menu;
    });
  }

  /**
   * Will make sure active menu
   * is toggled
   *
   * @return void
   */
  public function toggleActive()
  {
    foreach ($this->menus as $identifier => &$menu) {
      if (isset($menu['href']) && $menu['href'] === url()->current()) {
        $menu['toggled'] = true;
      }

      if (isset($menu['childrens'])) {
        foreach ($menu['childrens'] as $subidentifier => &$submenu) {
          if ($submenu['href'] === url()->current()) {
            $menu['toggled'] = true;
            $submenu['active'] = true;
          }
        }
      }
    }
  }
}
