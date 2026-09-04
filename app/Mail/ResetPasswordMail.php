<?php

namespace App\Mail;

use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class ResetPasswordMail extends Mailable
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
            ->from( sb()->option->get( 'sb_store_email', 'contact@subul.com' ), sb()->option->get( 'sb_store_name', env( 'APP_NAME' ) ) )
            ->to( $this->user->email )
            ->markdown( 'mails/reset-password-mail' );
    }
}
