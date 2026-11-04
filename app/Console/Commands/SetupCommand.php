<?php

namespace App\Console\Commands;

use App\Services\Helper;
use App\Services\SetupService;
use Illuminate\Console\Command;

class SetupCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'ns:setup {--store_name=} {--admin_username=} {--admin_email=} {--admin_password=} {--language=en}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Install Subul from the command line.';

    private $sb_store_name;

    private $admin_username;

    private $admin_email;

    private $admin_password;

    private $language;

    /**
     * determine if the actual command requis
     * a confirmation or can be skipped.
     */
    private $requireConfirmation = true;

    /**
     * Create a new command instance.
     *
     * @return void
     */
    public function __construct()
    {
        parent::__construct();
    }

    /**
     * Execute the console command.
     *
     * @return int
     */
    public function handle()
    {
        /**
         * The desktop shell hands the password over in the environment rather
         * than argv, where another local account could read it from the
         * process list while setup runs.
         */
        $adminPassword = $this->option( 'admin_password' ) ?: env( 'SUBUL_ADMIN_PASSWORD' );

        if (
            ! empty( $this->option( 'store_name' ) ) &&
            ! empty( $this->option( 'admin_email' ) ) &&
            ! empty( $this->option( 'admin_username' ) ) &&
            ! empty( $adminPassword )
        ) {
            $this->sb_store_name  = $this->option( 'store_name' );
            $this->admin_email    = $this->option( 'admin_email' );
            $this->admin_username = $this->option( 'admin_username' );
            $this->admin_password = $adminPassword;
            $this->language       = $this->option( 'language' );
            $this->requireConfirmation = false;
        }

        /**
         * Only probe the keys the active driver actually reads. Requiring the
         * MySQL credentials unconditionally blocked every CLI install, since
         * SQLite — the driver .env.example and the desktop package use — has
         * no host, user or password to supply.
         */
        $requiredKeys = match ( env( 'DB_CONNECTION', 'sqlite' ) ) {
            'sqlite' => [],
            default => [ 'DB_HOST', 'DB_DATABASE', 'DB_USERNAME' ],
        };

        $missingKeys = array_values( array_filter(
            $requiredKeys,
            fn ( $key ) => env( $key, null ) === null
        ) );

        if ( $missingKeys !== [] ) {
            return $this->error( __( 'Unable to proceed, looks like the database can\'t be used.' ) . ' (' . implode( ', ', $missingKeys ) . ')' );
        }

        if ( Helper::installed() ) {
            return $this->error( __( 'Subul is already installed.' ) );
        }

        $this->setupLanguage();
        $this->setupStoreName();
        $this->setupAdminUsername();
        $this->setupAdminPassword();
        $this->setupAdminEmail();

        $answer = 'n';
        if ( $this->requireConfirmation !== false ) {
            $answer = $this->ask( 'Everything seems ready. Would you like to proceed ? [Y]/[N]' );
        }

        if ( in_array( strtolower( $answer ), [ 'y', 'yes' ] ) || $this->requireConfirmation === false ) {
            /**
             * @var SetupService $service
             */
            $service = app()->make( SetupService::class );
            $service->runMigration( [
                'admin_username' => $this->admin_username,
                'admin_email'    => $this->admin_email,
                'password'       => $this->admin_password,
                'sb_store_name'  => $this->sb_store_name,
            ] );

            return $this->info( 'Thank you, Subul has been successfully installed.' );
        } else {
            return $this->info( 'The installation has been aborded.' );
        }
    }

    private function setupStoreName()
    {
        while ( empty( $this->sb_store_name ) ) {
            $this->sb_store_name = $this->askOrQuit( __( 'What is the store name ? [Q] to quit.' ) );

            if ( $this->sb_store_name === null ) {
                return;
            }

            if ( strlen( $this->sb_store_name ) < 6 ) {
                $this->error( __( 'Please provide at least 6 characters for store name.' ) );
                $this->sb_store_name = null;
            }
        }
    }

    private function setupAdminPassword()
    {
        while ( empty( $this->admin_password ) ) {
            $this->admin_password = $this->askOrQuit( __( 'What is the administrator password ? [Q] to quit.' ), secret: true );

            if ( $this->admin_password === null ) {
                return;
            }

            if ( strlen( $this->admin_password ) < 6 ) {
                $this->error( __( 'Please provide at least 6 characters for the administrator password.' ) );
                $this->admin_password = null;
            }
        }
    }

    private function setupLanguage()
    {
        while (empty($this->language)) {
            $languages      = config('subul.languages');
            $languageValues = array_values($languages);
            $languageKeys   = array_keys($languages);

            $selectedLanguage = $this->choice(
                __('In which language would you like to install Subul ?'),
                $languageValues
            );

            // Find the key (language code) for the selected language value
            $langIndex = array_search($selectedLanguage, $languageValues);
            if ($langIndex !== false) {
                $this->language = $languageKeys[$langIndex];

                if (strlen($this->language) != 2) {
                    $this->error(__('You must define the language of installation.'));
                    $this->language = null;
                }
            } else {
                $this->error(__('Invalid language selection.'));
                $this->language = null;
            }
        }
    }

    private function setupAdminEmail()
    {
        while ( empty( $this->admin_email ) ) {
            $this->admin_email = $this->askOrQuit( __( 'What is the administrator email ? [Q] to quit.' ) );

            if ( $this->admin_email === null ) {
                return;
            }

            $regex = '/^[_a-z0-9-]+(\.[_a-z0-9-]+)*@[a-z0-9-]+(\.[a-z0-9-]+)*(\.[a-z]{2,3})$/';

            if ( ! preg_match( $regex, $this->admin_email ) ) {
                $this->error( __( 'Please provide a valid email for the administrator.' ) );
                $this->admin_email = null;
            }
        }
    }

    private function setupAdminUsername()
    {
        while ( empty( $this->admin_username ) ) {
            $this->admin_username = $this->askOrQuit( __( 'What is the administrator username ? [Q] to quit.' ) );

            if ( $this->admin_username === null ) {
                return;
            }

            if ( strlen( $this->admin_username ) < 5 ) {
                $this->error( __( 'Please provide at least 5 characters for the administrator username.' ) );
                $this->admin_username = null;
            }
        }
    }

    /**
     * Ask a question and return null (signaling an exit) if the user types 'Q'.
     * Centralises the quit-pattern that was previously duplicated across every
     * interactive setup method.
     */
    private function askOrQuit( string $prompt, bool $secret = false ): ?string
    {
        $answer = $secret ? $this->secret( $prompt ) : $this->ask( $prompt );

        if ( $answer === 'Q' ) {
            $this->info( 'The setup has been interrupted.' );
            exit;
        }

        return $answer;
    }
}
