<?php

namespace App\Mail;

use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class UserRegisteredMail extends Mailable
{
    use Queueable, SerializesModels;

    public $user;

    public $admin;

    /**
     * Create a new message instance.
     *
     * @return void
     */
    public function __construct( User $admin, User $user )
    {
        $this->admin = $admin;
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
            ->subject( sb()->option->get( 'sb_notifications_registrations_administrator_email_title', __( '[Subul] A New User Has Registered' ) ) )
            ->from( sb()->option->get( 'sb_store_email', 'notifications@subul.com' ) )
            ->markdown( 'mails/user-registered-mail' );
    }
}
