<?php

namespace App\Traits;

use App\Classes\Hook;
use App\Services\CrudService;
use App\Services\SettingsPage;
use Illuminate\Http\Request;

trait SbForms
{
    /**
     * Provide a callback notation for
     * a specific method
     */
    public static function method( string $methodName ): string
    {
        return get_called_class() . '@' . $methodName;
    }

    public function extractProductValidaton( $model = null ): array
    {
        $form = $this->getFormObject( $model );

        $rules = [];

        if ( isset( $form['main']['validation'] ) ) {
            $rules[$form['main']['name']] = $form['main']['validation'];
        }

        /**
         * Phase 5 (docs/plans/backend-driven-completion/05): the variations
         * tree is a declarative root custom section (`{ component, value,
         * tabs }`) and the crud write path flattens it through
         * ProductCrud::getFlatForm BEFORE these rules run in
         * beforePost/beforePut — so the rules address the flat payload keys
         * (`category_id`, `units.selling_group.*.unit_id`, …), not the raw
         * `variations.*` tree.
         */
        foreach ( $form['variations']['tabs'] ?? [] as $tabIdentifier => $tab ) {
            if ( empty( $tab['fields'] ) ) {
                continue;
            }

            /**
             * getFlatForm hoists the identification/expiracy/taxes leaves to
             * the payload top level, while `units` and `groups` are restored
             * as arrays (their containers survive the flattening), so their
             * field keys stay tab-prefixed.
             */
            $prefix = in_array( $tabIdentifier, [ 'units', 'groups' ] ) ? $tabIdentifier . '.' : '';

            foreach ( $tab['fields'] as $field ) {
                if ( ! empty( $field['validation'] ) ) {
                    $rules[$prefix . $field['name']] = $field['validation'];
                }

                if ( ( $field['type'] ?? '' ) === 'group' && ! empty( $field['fields'] ) ) {
                    foreach ( $field['fields'] as $groupField ) {
                        if ( ! empty( $groupField['validation'] ) ) {
                            $rules[$prefix . $field['name']]['*'][$groupField['name']] = $groupField['validation'];
                        }
                    }
                }
            }
        }

        return $rules;
    }

    /**
     * Extracts validation from either a crud form or setting page.
     */
    public function extractValidation( $model = null ): array
    {
        $form = $this->getFormObject( model: $model );

        $rules = [];

        if ( isset( $form[ 'main' ][ 'validation' ] ) ) {
            $rules[ $form[ 'main' ][ 'name' ] ] = $form[ 'main' ][ 'validation' ];
        }

        /**
         * Root custom sections (e.g. ProductCrud's `variations`) carry their
         * own nested tabs — the rules extracted here are `{tabId}.{field}`
         * only. Guard against Cruds without a root `tabs` key.
         */
        foreach ( $form[ 'tabs' ] ?? [] as $tabIdentifier => $tab ) {
            if ( ! empty( $tab[ 'fields' ] ) ) {
                foreach ( $tab[ 'fields' ] as $field ) {
                    if ( isset( $field[ 'validation' ] ) ) {
                        $rules[ $tabIdentifier ][ $field[ 'name' ] ] = $field[ 'validation' ];
                    }
                }
            }
        }

        return $rules;
    }

    /**
     * Returns the array that represent the
     * form object for either the CrudService or the SettingsPage.
     */
    private function getFormObject( $model = null ): array
    {
        if ( is_subclass_of( $this, CrudService::class ) || is_subclass_of( $this, SettingsPage::class ) ) {
            return Hook::filter( get_class( $this )::method( 'getForm' ), $this->getForm( $model ), compact( 'model' ) );
        }

        return [];
    }

    /**
     * Isolate Rules that use the Rule class
     */
    public function isolateArrayRules( array $arrayRules, string $parentKey = '' ): array
    {
        $rules = [];

        foreach ( $arrayRules as $key => $value ) {
            if ( is_array( $value ) && collect( array_keys( $value ) )->filter( function ( $key ) {
                return is_string( $key );
            } )->count() > 0 ) {
                $rules = array_merge( $rules, $this->isolateArrayRules( $value, $key ) );
            } else {
                $rules[] = [ ( ! empty( $parentKey ) ? $parentKey . '.' : '' ) . $key, $value ];
            }
        }

        return $rules;
    }

    /**
     * Return flat fields for the crud form provided
     */
    public function getFlatForm( array $fields, $model = null ): array
    {
        $form = $this->getFormObject( model: $model );
        $data = [];

        if ( isset( $form[ 'main' ][ 'name' ] ) ) {
            $data[ $form[ 'main' ][ 'name' ] ] = $fields[ $form[ 'main' ][ 'name' ] ];
        }

        foreach ( $form[ 'tabs' ] ?? [] as $tabKey => $tab ) {
            /**
             * if the object bein used is not an instance
             * of a Crud and include the method, let's skip
             * this.
             */
            $keys = [];
            if ( method_exists( $this, 'getTabsRelations' ) ) {
                $keys = array_keys( $this->getTabsRelations() );
            }

            /**
             * We're ignoring the tabs
             * that are linked to a model.
             */
            if ( ! in_array( $tabKey, $keys ) && ! empty( $tab[ 'fields' ] ) ) {
                foreach ( $tab[ 'fields' ] as $field ) {
                    $value = data_get( $fields, $tabKey . '.' . $field[ 'name' ] );

                    /**
                     * if the field doesn't have any value (null or empty string)
                     * we'll omit it. To avoid filling wrong value while rescuing 0, '0', and false.
                     */
                    if ( $value !== null && $value !== '' ) {
                        $data[ $field[ 'name' ] ] = $value;
                    }
                }
            }
        }

        /**
         * We'll add custom fields
         * that might be added by modules
         */
        $fieldsToIgnore = array_keys( collect( $form[ 'tabs' ] ?? [] )->toArray() );

        foreach ( $fields as $field => $value ) {
            if ( ! in_array( $field, $fieldsToIgnore ) ) {
                $data[ $field ] = $value;
            }
        }

        return $data;
    }

    /**
     * Return plain data that can be used
     * for inserting. The data is parsed from the defined
     * form on the Request.
     */
    public function getPlainData( Request $request, $model = null ): array
    {
        $fields = $request->post();

        return $this->getFlatForm( $fields, $model );
    }

    /**
     * The PHP version of FormValidation.extractForm.
     * This returns a flattened version of a Form.
     */
    public function extractForm( $form ): array
    {
        $formValue = [];

        if ( isset( $form['main'] ) ) {
            $formValue[$form['main']['name']] = $form['main']['value'];
        }

        if ( isset( $form['tabs'] ) ) {
            foreach ( $form['tabs'] as $tabIdentifier => $tab ) {
                if ( ! isset( $formValue[$tabIdentifier] ) ) {
                    $formValue[$tabIdentifier] = [];
                }

                $formValue[$tabIdentifier] = $this->extractFields( $tab[ 'fields' ] );
            }
        }

        return $formValue;
    }

    public function extractFields( $fields, $formValue = [] )
    {
        foreach ( $fields as $field ) {
            $formValue[$field['name']] = $field['value'] ?? '';
        }

        return $formValue;
    }
}
