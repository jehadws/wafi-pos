<?php

namespace App\Services;

use App\Models\Option;
use App\Models\PaymentType;

class Options
{
    private $rawOptions = [];

    public string $tableName;

    /**
     * the option class can be constructed with the user id.
     * If the user is not provided, the general options are loaded instead.
     */
    public function __construct()
    {
        $this->tableName = (new Option)->getTable();
        $this->build();
    }

    /**
     * Will reset the default options
     *
     * @param array $options
     */
    public function setDefault($options = []): void
    {
        Option::truncate();

        $defaultOptions = [
            'sb_registration_enabled' => 'no',
            'sb_store_name' => 'Subul',
            'sb_subul_allow_decimal_quantities' => 'yes',
            'sb_subul_quick_product' => 'yes',
            'sb_subul_show_quantity' => 'yes',
            'sb_currency_precision' => 2,
            'sb_subul_hide_empty_categories' => 'yes',
            'sb_subul_unit_price_ediable' => 'yes',
            'sb_subul_order_types' => ['takeaway', 'delivery'],
            'sb_subul_registers_default_change_payment_type' => PaymentType::where('identifier', 'cash-payment')->first()?->id ?? 1,
        ];

        $options = array_merge($defaultOptions, $options);

        foreach ($options as $key => $value) {
            $this->set($key, $value);
        }
    }

    /**
     * return option service
     *
     * @return object
     */
    public function option()
    {
        return Option::where('user_id', null);
    }

    /**
     * Build
     * Build option array
     *
     * @return void
     **/
    public function build()
    {
        if (Helper::installed() && empty($this->rawOptions)) {
            $this->rawOptions = $this->option()
                ->get()
                ->mapWithKeys(function ($option) {
                    return [
                        $option->key => $option,
                    ];
                });
        }
    }

    /**
     * Rebuild the options to ensure having
     * on the rawOptions the latest options.
     *
     * @return void
     **/
    public function rebuild()
    {
        if (Helper::installed()) {
            $this->rawOptions = $this->option()
                ->get()
                ->mapWithKeys(function ($option) {
                    return [
                        $option->key => $option,
                    ];
                });
        }
    }

    /**
     * Set Option
     *
     * @param string key
     * @param any value
     * @param bool force set
     * @return void
     **/
    public function set($key, $value, $expiration = null, ?string $allowedTags = null)
    {
        if (isset($this->rawOptions[$key])) {
            $this->rawOptions[$key]->value = $value;
            $this->rawOptions[$key]->expire_on = $expiration;

            $this->encodeOptionValue($this->rawOptions[$key], $value, $allowedTags);

            $this->rawOptions[$key]->save();
        } else {
            $option = new Option;
            $option->key = trim(strtolower($key));
            $option->array = false;
            $option->value = $value;
            $option->expire_on = $expiration;

            $this->encodeOptionValue($option, $value, $allowedTags);

            $option->save();
            $this->rawOptions[$key] = $option;
        }
    }

    /**
     * Encodes the value for the option before saving.
     */
    public function encodeOptionValue(Option $option, mixed $value, ?string $allowedTags = null): void
    {
        if (is_array($value)) {
            $option->array = true;
            $option->value = json_encode($value);
        } elseif (empty($value) && ! (bool) preg_match('/[0-9]{1,}/', $value)) {
            $option->value = '';
        } else {
            $option->value = $value;
        }

        $this->sanitizeValue($option, $allowedTags);
    }

    /**
     * Sanitizes values before storing on the database.
     * Fields that opt in with an `allowedTags` allowlist
     * keep those tags, every other value is blanket
     * stripped (backward compatible default).
     */
    public function sanitizeValue(Option $option, ?string $allowedTags = null)
    {
        /**
         * sanitizing input to remove
         * all script tags
         */
        $option->value = strip_tags($option->value, $allowedTags ?? '');
    }

    /**
     * Get options
     **/
    public function get(string|array|null $key = null, mixed $default = null)
    {
        if ($key === null) {
            return $this->rawOptions;
        }

        $filtredOptions = collect($this->rawOptions)->filter(function ($option) use ($key) {
            return is_array($key) ? in_array($option->key, $key) : $option->key === $key;
        });

        $options = $filtredOptions->map(function ($option) {
            $this->decodeOptionValue($option);

            return $option;
        });

        return match ($options->count()) {
            0 => $default,
            1 => $options->first()->value,
            default => $options->map(fn($option) => $option->value)->toArray()
        };
    }

    public function decodeOptionValue($option)
    {
        /**
         * We should'nt run this everytime we
         * try to pull an option from the database or from the array
         */
        if (! empty($option->value) && $option->isClean()) {
            if (is_string($option->value) && $option->array) {
                $json = json_decode($option->value, true);

                if (json_last_error() == JSON_ERROR_NONE) {
                    $option->value = $json;
                } else {
                    $option->value = null;
                }
            } elseif (! $option->array) {
                if (preg_match('/^[0-9]{1,}$/', $option->value)) {
                    $option->value = (int) $option->value;
                } elseif (preg_match('/^[0-9]{1,}\.[0-9]{1,}$/', $option->value)) {
                    $option->value = (float) $option->value;
                } else {
                    $option->value = $option->value;
                }
            }
        }
    }

    /**
     * Delete an option using a specific key.
     **/
    public function delete(string $key): void
    {
        $this->rawOptions = collect($this->rawOptions)->filter(function (Option $option) use ($key) {
            if ($option->key === $key) {
                $option->delete();

                return false;
            }

            return true;
        });
    }
}
