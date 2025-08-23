import { formatCurrency } from '@/utils/format'

type Summary = {
  sales_discounts: number
  product_taxes: number
  sales_taxes: number
  subtotal: number
  shipping: number
  profit: number
  total_purchase_price: number
  total: number
}

export default function SalesSummary({ summary }: { summary: Summary }) {
  return (
    <div className="mb-8">
      <h3 className="text-lg font-semibold mb-4">Financial Summary</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {/* Sub Total Card */}
        <div className="bg-gradient-to-r from-blue-50 dark:from-blue-600 to-blue-100 dark:to-blue-800 border border-blue-200 dark:border-blue-700 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-700 dark:text-blue-300">Sub Total</p>
              <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">{formatCurrency(summary.subtotal)}</p>
            </div>
            <div className="w-10 h-10 bg-blue-500 dark:bg-blue-400 rounded-full flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
              </svg>
            </div>
          </div>
        </div>

        {/* Total Card */}
        <div className="bg-gradient-to-r from-green-50 dark:from-green-600 to-green-100 dark:to-green-800 border border-green-200 dark:border-green-700 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-green-700 dark:text-green-300">Total</p>
              <p className="text-2xl font-bold text-green-900 dark:text-green-100">{formatCurrency(summary.total)}</p>
            </div>
            <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>

        {/* Cost of Goods Card */}
        <div className="bg-gradient-to-r from-purple-50 dark:from-purple-600 to-purple-100 dark:to-purple-800 border border-purple-200 dark:border-purple-700 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-purple-700 dark:text-purple-300">Cost of Goods</p>
              <p className="text-2xl font-bold text-purple-900 dark:text-purple-100">{formatCurrency(summary.total_purchase_price)}</p>
            </div>
            <div className="w-10 h-10 bg-purple-500 rounded-full flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
          </div>
        </div>

        {/* Profit Card */}
        <div className="bg-gradient-to-r from-emerald-50 dark:from-emerald-600 to-emerald-100 dark:to-emerald-800 border border-emerald-200 dark:border-emerald-700 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-emerald-700 dark:text-emerald-300">Profit</p>
              <p className="text-2xl font-bold text-emerald-900 dark:text-emerald-100">{formatCurrency(summary.profit)}</p>
            </div>
            <div className="w-10 h-10 bg-emerald-500 rounded-full flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Detailed Breakdown */}
      <div className="bg-white dark:bg-muted border rounded-lg p-6 shadow-sm">
        <h4 className="text-md font-semibold mb-4 text-gray-800 dark:text-gray-200">Detailed Breakdown</h4>
        <div className="space-y-3">
          <div className="flex items-center justify-between py-2 border-b">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-red-500 rounded-full"></div>
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Sales Discounts</span>
            </div>
            <span className="text-sm font-semibold text-red-600">-{formatCurrency(summary.sales_discounts)}</span>
          </div>

          <div className="flex items-center justify-between py-2 border-b">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-red-500 rounded-full"></div>
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Sales Taxes</span>
            </div>
            <span className="text-sm font-semibold text-gray-600">{formatCurrency(summary.sales_taxes)}</span>
          </div>

          <div className="flex items-center justify-between py-2 border-b">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Product Taxes</span>
            </div>
            <span className="text-sm font-semibold text-orange-600">{formatCurrency(summary.product_taxes)}</span>
          </div>

          <div className="flex items-center justify-between py-2">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Shipping</span>
            </div>
            <span className="text-sm font-semibold text-blue-600">{formatCurrency(summary.shipping)}</span>
          </div>
        </div>

        {/* Profit Margin */}
        <div className="mt-6 pt-4 border-t">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Profit Margin</span>
            <span className="text-sm font-semibold text-emerald-600">
              {((summary.profit / summary.total) * 100).toFixed(1)}%
            </span>
          </div>
          <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-gradient-to-r from-emerald-400 dark:from-emerald-500 to-emerald-600 dark:to-emerald-700 h-2 rounded-full transition-all duration-300"
              style={{ width: `${Math.min(((summary.profit / summary.total) * 100), 100)}%` }}
            ></div>
          </div>
        </div>
      </div>
    </div>
  )
}

