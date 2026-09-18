<?php

namespace App\Http\Requests;

use App\Crud\ProductCrud;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Arr;

class ProductRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        $crudInstance = new ProductCrud;
        $product = $this->route( 'product' );
        $extractValidation = $crudInstance->extractProductValidaton( $product );
        $rules = Arr::dot( $extractValidation );

        return $rules;
    }

    public function attributes()
    {
        return [
            'units.selling_group.*.convert_unit_id' => __( 'Convert Unit' ),
            'units.selling_group.*.unit_id' => __( 'Unit' ),
        ];
    }
}
