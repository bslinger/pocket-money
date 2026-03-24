<?php

namespace App\Notifications;

class ChoreSubmittedForApproval extends BaseNotification
{
    protected function title(): string
    {
        return 'Quiddo';
    }

    protected function body(): string
    {
        return 'A chore needs your approval';
    }

    protected function deepLink(): string
    {
        return 'quiddo://chores';
    }
}
