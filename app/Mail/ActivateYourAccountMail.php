<?php

namespace App\Mail;

use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class ActivateYourAccountMail extends Mailable
{
    use Queueable, SerializesModels;

    public $user;

    /**
     * Create a new message instance.
     *
     * @return void
     */
    public function __construct( User $user )
    {
        $this->user = $user;
    }

    /**
     * Build the message.
     *
     * @return $this
     */
    public function build()
    {
        return $this
            ->subject( sb()->option->get( 'sb_notifications_registrations_user_activate_title', __( '[Subul] Activate Your Account' ) ) )
            ->from( sb()->option->get( 'sb_store_email', 'notifications@subul.com' ) )
            ->markdown( 'mails/activate-your-account-mail' );
    }
}
