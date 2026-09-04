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
        'href' => sb()->url('/dashboard'),
        'icon' => 'Home',
      ],
      'pos' => [
        'label' => __('POS'),
        'icon' => 'ShoppingCart',
        'permissions' => ['subul.create.orders'],
        'href' => sb()->url('/dashboard/pos'),
      ],
      'orders' => [
        'label' => __('Orders'),
        'permissions' => ['subul.read.orders'],
        'icon' => 'ListOrdered',
        'childrens' => [
          'order-list' => [
            'label' => __('Orders List'),
            'href' => sb()->url('/dashboard/orders'),
            'permissions' => ['subul.read.orders'],
          ],
          'payment-type' => [
            'label' => __('Payment Types'),
            'href' => sb()->url('/dashboard/orders/payments-types'),
            'permissions' => ['subul.manage-payments-types'],
          ],
        ],
      ],
      'medias' => [
        'label' => __('Medias'),
        'permissions' => ['subul.upload.medias', 'subul.see.medias'],
        'icon' => 'FileImage',
        'href' => sb()->url('/dashboard/medias'),
      ],
      'customers' => [
        'label' => __('Customers'),
        'permissions' => [
          'subul.read.customers',
          'subul.create.customers',
          'subul.read.customers-groups',
          'subul.create.customers-groups',
          'subul.import.customers',
          'subul.read.rewards',
          'subul.create.rewards',
          'subul.read.coupons',
          'subul.create.coupons',
        ],
        'icon' => 'Users',
        'childrens' => [
          'customers' => [
            'label' => __('List'),
            'permissions' => ['subul.read.customers'],
            'href' => sb()->url('/dashboard/customers'),
          ],
          'create-customer' => [
            'label' => __('Create Customer'),
            'permissions' => ['subul.create.customers'],
            'href' => sb()->url('/dashboard/customers/create'),
          ],
          'customers-groups' => [
            'label' => __('Customers Groups'),
            'permissions' => ['subul.read.customers-groups'],
            'href' => sb()->url('/dashboard/customers/groups'),
          ],
          'create-customers-group' => [
            'label' => __('Create Group'),
            'permissions' => ['subul.create.customers-groups'],
            'href' => sb()->url('/dashboard/customers/groups/create'),
          ],
          'list-reward-system' => [
            'label' => __('Reward Systems'),
            'permissions' => ['subul.read.rewards'],
            'href' => sb()->url('/dashboard/customers/rewards-system'),
          ],
          'create-reward-system' => [
            'label' => __('Create Reward'),
            'permissions' => ['subul.create.rewards'],
            'href' => sb()->url('/dashboard/customers/rewards-system/create'),
          ],
          'list-coupons' => [
            'label' => __('List Coupons'),
            'permissions' => ['subul.read.coupons'],
            'href' => sb()->url('/dashboard/customers/coupons'),
          ],
          'create-coupons' => [
            'label' => __('Create Coupon'),
            'permissions' => ['subul.create.coupons'],
            'href' => sb()->url('/dashboard/customers/coupons/create'),
          ],
        ],
      ],
      'providers' => [
        'label' => __('Providers'),
        'icon' => 'User',
        'permissions' => [
          'subul.read.providers',
          'subul.create.providers',
        ],
        'childrens' => [
          'providers' => [
            'label' => __('List'),
            'permissions' => ['subul.read.providers'],
            'href' => sb()->url('/dashboard/providers'),
          ],
          'create-provider' => [
            'label' => __('Create A Provider'),
            'permissions' => ['subul.create.providers'],
            'href' => sb()->url('/dashboard/providers/create'),
          ],
        ],
      ],
      'accounting' => [
        'label' => __('Accounting'),
        'icon' => 'Layers',
        'permissions' => [
          'subul.read.transactions',
          'subul.create.transactions',
          'subul.read.transactions-account',
          'subul.create.transactions-account',
        ],
        'childrens' => [
          'transactions' => [
            'label' => __('Expenses'),
            'permissions' => ['subul.read.transactions'],
            'href' => sb()->url('/dashboard/accounting/transactions'),
          ],
          'create-transaction' => [
            'label' => __('Create Expense'),
            'permissions' => ['subul.create.transactions'],
            'href' => sb()->url('/dashboard/accounting/transactions/create'),
          ],
          'transactions-history' => [
            'label' => __('Transaction History'),
            'permissions' => ['subul.read.transactions-history'],
            'href' => sb()->url('/dashboard/accounting/transactions/history'),
          ],
          'transacations-rules' => [
            'label' => __('Rules'),
            'permissions' => ['subul.create.transactions'],
            'href' => sb()->url('/dashboard/accounting/rules'),
          ],
          'transactions-account' => [
            'label' => __('Accounts'),
            'permissions' => ['subul.read.transactions-account'],
            'href' => sb()->url('/dashboard/accounting/accounts'),
          ],
          'create-transactions-account' => [
            'label' => __('Create Account'),
            'permissions' => ['subul.create.transactions-account'],
            'href' => sb()->url('/dashboard/accounting/accounts/create'),
          ],
        ],
      ],
      'inventory' => [
        'label' => __('Inventory'),
        'icon' => 'Package',
        'permissions' => [
          'subul.read.products',
          'subul.create.products',
          'subul.read.categories',
          'subul.create.categories',
          'subul.read.products-units',
          'subul.create.products-units',
          'subul.read.products-units',
          'subul.create.products-units',
          'subul.make.products-adjustments',
        ],
        'childrens' => [
          'products' => [
            'label' => __('Products'),
            'permissions' => ['subul.read.products'],
            'href' => sb()->url('/dashboard/products'),
          ],
          'create-products' => [
            'label' => __('Create Product'),
            'permissions' => ['subul.create.products'],
            'href' => sb()->url('/dashboard/products/create'),
          ],
          'labels-printing' => [
            'label' => __('Print Labels'),
            'href' => sb()->url('/dashboard/products/print-labels'),
            'permissions' => ['subul.create.products-labels'],
          ],
          'categories' => [
            'label' => __('Categories'),
            'permissions' => ['subul.read.categories'],
            'href' => sb()->url('/dashboard/products/categories'),
          ],
          'create-categories' => [
            'label' => __('Create Category'),
            'permissions' => ['subul.create.categories'],
            'href' => sb()->url('/dashboard/products/categories/create'),
          ],
          'units' => [
            'label' => __('Units'),
            'permissions' => ['subul.read.products-units'],
            'href' => sb()->url('/dashboard/units'),
          ],
          'create-units' => [
            'label' => __('Create Unit'),
            'permissions' => ['subul.create.products-units'],
            'href' => sb()->url('/dashboard/units/create'),
          ],
          'unit-groups' => [
            'label' => __('Unit Groups'),
            'permissions' => ['subul.read.products-units'],
            'href' => sb()->url('/dashboard/units/groups'),
          ],
          'create-unit-groups' => [
            'label' => __('Create Unit Groups'),
            'permissions' => ['subul.create.products-units'],
            'href' => sb()->url('/dashboard/units/groups/create'),
          ],
          'stock-adjustment' => [
            'label' => __('Stock Adjustment'),
            'permissions' => ['subul.make.products-adjustments'],
            'href' => sb()->url('/dashboard/products/stock-adjustment'),
          ],
          'product-history' => [
            'label' => __('Stock Flow Records'),
            'permissions' => ['subul.read.products'],
            'href' => sb()->url('/dashboard/products/stock-flow-records'),
          ],
        ],
      ],
      'taxes' => [
        'label' => __('Taxes'),
        'icon' => 'FileText',
        'permissions' => [
          'subul.create.taxes',
          'subul.read.taxes',
          'subul.update.taxes',
          'subul.delete.taxes',
        ],
        'childrens' => [
          'taxes-groups' => [
            'label' => __('Taxes Groups'),
            'permissions' => ['subul.read.taxes'],
            'href' => sb()->url('/dashboard/taxes/groups'),
          ],
          'create-taxes-group' => [
            'label' => __('Create Tax Groups'),
            'permissions' => ['subul.create.taxes'],
            'href' => sb()->url('/dashboard/taxes/groups/create'),
          ],
          'taxes' => [
            'label' => __('Taxes'),
            'permissions' => ['subul.read.taxes'],
            'href' => sb()->url('/dashboard/taxes'),
          ],
          'create-tax' => [
            'label' => __('Create Tax'),
            'permissions' => ['subul.create.taxes'],
            'href' => sb()->url('/dashboard/taxes/create'),
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
            'href' => sb()->url('/dashboard/modules'),
          ],
          'upload-module' => [
            'label' => __('Upload Module'),
            'href' => sb()->url('/dashboard/modules/upload'),
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
            'href' => sb()->url('/dashboard/users/profile'),
          ],
          'users' => [
            'label' => __('Users List'),
            'permissions' => ['read.users'],
            'href' => sb()->url('/dashboard/users'),
          ],
          'create-user' => [
            'label' => __('Create User'),
            'permissions' => ['create.users'],
            'href' => sb()->url('/dashboard/users/create'),
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
            'href' => sb()->url('/dashboard/users/roles'),
          ],
          'create-role' => [
            'label' => __('Create Roles'),
            'permissions' => ['create.roles'],
            'href' => sb()->url('/dashboard/users/roles/create'),
          ],
          'permissions' => [
            'label' => __('Permissions Manager'),
            'permissions' => ['update.roles'],
            'href' => sb()->url('/dashboard/users/roles/permissions-manager'),
          ],
        ],
      ],
      'procurements' => [
        'label' => __('Procurements'),
        'icon' => 'Truck',
        'permissions' => ['subul.read.procurements', 'subul.create.procurements'],
        'childrens' => [
          'procurements' => [
            'label' => __('Procurements List'),
            'permissions' => ['subul.read.procurements'],
            'href' => sb()->url('/dashboard/procurements'),
          ],
          'procurements-create' => [
            'label' => __('New Procurement'),
            'permissions' => ['subul.create.procurements'],
            'href' => sb()->url('/dashboard/procurements/create'),
          ],
          'procurements-products' => [
            'label' => __('Products'),
            'permissions' => ['subul.update.procurements'],
            'href' => sb()->url('/dashboard/procurements/products'),
          ],
        ],
      ],
      'reports' => [
        'label' => __('Reports'),
        'icon' => 'BarChart3',
        'permissions' => [
          'subul.reports.sales',
          'subul.reports.best_sales',
          'subul.reports.transactions',
          'subul.reports.yearly',
          'subul.reports.customers',
          'subul.reports.inventory',
          'subul.reports.payment-types',
        ],
        'childrens' => [
          'sales' => [
            'label' => __('Sale Report'),
            'permissions' => ['subul.reports.sales'],
            'href' => sb()->url('/dashboard/reports/sales'),
          ],
          'products-report' => [
            'label' => __('Sales Progress'),
            'permissions' => ['subul.reports.products-report'],
            'href' => sb()->url('/dashboard/reports/sales-progress'),
          ],
          'customers-statement' => [
            'label' => __('Customers Statement'),
            'permissions' => ['subul.reports.customers-statement'],
            'href' => sb()->url('/dashboard/reports/customers-statement'),
          ],
          'low-stock' => [
            'label' => __('Stock Report'),
            'permissions' => ['subul.reports.low-stock'],
            'href' => sb()->url('/dashboard/reports/low-stock'),
          ],
          'stock-history' => [
            'label' => __('Stock History'),
            'permissions' => ['subul.reports.stock-history'],
            'href' => sb()->url('/dashboard/reports/stock-history'),
          ],
          'sold-stock' => [
            'label' => __('Sold Stock'),
            'href' => sb()->url('/dashboard/reports/sold-stock'),
          ],
          'profit' => [
            'label' => __('Incomes & Loosses'),
            'href' => sb()->url('/dashboard/reports/profit'),
          ],
          'transactions' => [
            'label' => __('Transactions'),
            'permissions' => ['subul.reports.transactions'],
            'href' => sb()->url('/dashboard/reports/transactions'),
          ],
          'annulal-sales' => [
            'label' => __('Annual Report'),
            'permissions' => ['subul.reports.yearly'],
            'href' => sb()->url('/dashboard/reports/annual-report'),
          ],
          'payment-types' => [
            'label' => __('Sales By Payments'),
            'permissions' => ['subul.reports.payment-types'],
            'href' => sb()->url('/dashboard/reports/payment-types'),
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
            'href' => sb()->url('/dashboard/settings/general'),
          ],
          'pos' => [
            'label' => __('POS'),
            'href' => sb()->url('/dashboard/settings/pos'),
          ],
          'customers' => [
            'label' => __('Customers'),
            'href' => sb()->url('/dashboard/settings/customers'),
          ],
          'orders' => [
            'label' => __('Orders'),
            'href' => sb()->url('/dashboard/settings/orders'),
          ],
          'accounting' => [
            'label' => __('Accounting'),
            'href' => sb()->url('/dashboard/settings/accounting'),
          ],
          'reports' => [
            'label' => __('Reports'),
            'href' => sb()->url('/dashboard/settings/reports'),
          ],
          'invoices' => [
            'label' => __('Invoices'),
            'href' => sb()->url('/dashboard/settings/invoices'),
          ],
          'workers' => [
            'label' => __('Workers'),
            'href' => sb()->url('/dashboard/settings/workers'),
          ],
          'reset' => [
            'label' => __('Reset'),
            'href' => sb()->url('/dashboard/settings/reset'),
          ],
          'about' => [
            'label' => __('About'),
            'href' => sb()->url('/dashboard/settings/about'),
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
    $this->menus = Hook::filter('sb-dashboard-menus', $this->menus);
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
        $currentUrl = url()->current();

        foreach ($this->menus as &$menu) {
            $menu['active'] = false;
            $menu['toggled'] = false;

            if (isset($menu['href']) && $menu['href'] === $currentUrl) {
                $menu['active'] = true;
            }

            if (isset($menu['childrens'])) {
                $isChildActive = false;
                foreach ($menu['childrens'] as &$submenu) {
                    $submenu['active'] = false;
                    if (isset($submenu['href']) && $submenu['href'] === $currentUrl) {
                        $submenu['active'] = true;
                        $isChildActive = true;
                    }
                }

                if ($isChildActive) {
                    $menu['toggled'] = true;
                }
            }
        }
    }
}
