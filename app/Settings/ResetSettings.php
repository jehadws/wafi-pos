<?php

namespace App\Settings;

use App\Classes\FormInput;
use App\Classes\Hook;
use App\Classes\SettingForm;
use App\Services\Helper;
use App\Services\SettingsPage;

class ResetSettings extends SettingsPage
{
    const IDENTIFIER = 'reset';
    const VIEW = 'dashboard/settings/reset';
    const AUTOLOAD = true;

    protected $form;

    public function __construct()
    {
        $this->form = SettingForm::form(
            title: __( 'Reset Database' ),
            description: __( 'Wipe transactions and optionally populate fresh demo data.' ),
            tabs: SettingForm::tabs(
                SettingForm::tab(
                    identifier: 'reset',
                    label: __( 'Reset' ),
                    fields: SettingForm::fields(
                        FormInput::select(
                            name: 'mode',
                            label: __( 'Mode' ),
                            validation: 'required',
                            options: $this->getModeOptions(),
                            description: __( 'Choose what mode applies to this reset.' ),
                        ),
                        FormInput::checkbox(
                            name: 'create_sales',
                            label: __( 'Create Sales (needs Procurements)' ),
                            value: 1,
                            description: __( 'Set if the sales should be created.' ),
                        ),
                        FormInput::checkbox(
                            name: 'create_procurements',
                            label: __( 'Create Procurements' ),
                            value: 1,
                            description: __( 'Will create procurements.' ),
                        )
                    )
                )
            )
        );
    }

    /**
     * Get available reset modes
     *
     * @return array
     */
    public function getModeOptions(): array
    {
        $modes = Hook::filter( 'sb-reset-options', [
            'wipe_plus_grocery' => __( 'Wipe & Seed Grocery Demo' ),
            'wipe_all' => __( 'Wipe All Records (Clean State)' ),
        ] );

        return Helper::kvToJsOptions( $modes );
    }

    /**
     * Initial form payload for Inertia view
     *
     * @return array
     */
    public function getPayload(): array
    {
        return [
            'mode' => 'wipe_plus_grocery',
            'create_sales' => true,
            'create_procurements' => true,
        ];
    }

    /**
     * Selectable options for Inertia view
     *
     * @return array
     */
    public function getOptions(): array
    {
        return [
            'modes' => $this->getModeOptions(),
        ];
    }
}
