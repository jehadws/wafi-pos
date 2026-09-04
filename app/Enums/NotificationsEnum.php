<?php

namespace App\Enums;

/**
 * @todo should be moved to the model Notification.
 */
class NotificationsEnum
{
    const SBCRONDISABLED = 'sb.notifications.cron-disabled';

    const SBWORKERDISABLED = 'sb.notifications.workers-disabled';

    const SBCHEDULEDTRANSACTIONS = 'sb.notifications.scheduled-transactions';

    const SBSYMBOLICLINKSMISSING = 'sb.notifications.symbolic-links-missing';
}
