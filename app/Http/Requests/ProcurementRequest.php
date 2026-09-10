<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class ProcurementRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     *
     * @return bool
     */
    public function authorize()
    {
        return $this->isMethod('post')
            ? sb()->allowedTo([ 'subul.create.procurements' ])
            : sb()->allowedTo([ 'subul.update.procurements' ]);
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array
     */
    public function rules()
    {
        return [
            'name' => 'nullable|string|max:255',

            'general.delivery_status' => 'required|in:delivered,pending,draft',
            'general.payment_status' => 'required|in:paid,unpaid',
            'general.provider_id' => 'required|integer|exists:subul_providers,id',
            'general.invoice_reference' => 'nullable|string|max:255',
            'general.automatic_approval' => 'nullable|boolean',

            'products' => 'nullable|array',
            'products.*.product_id' => 'required|integer|exists:subul_products,id',
            'products.*.unit_id' => 'required|integer',
            'products.*.quantity' => 'required|numeric|min:0',
            'products.*.purchase_price' => 'nullable|numeric|min:0',
            'products.*.tax_type' => 'nullable|in:inclusive,exclusive',
        ];
    }
}

