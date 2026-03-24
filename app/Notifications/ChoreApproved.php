<?php

namespace App\Notifications;

class ChoreApproved extends BaseNotification
{
    protected function title(): string
    {
        return 'Quiddo';
    }

    protected function body(): string
    {
        return 'Your chore was approved!';
    }

    protected function deepLink(): string
    {
        return 'quiddo://';
    }
}
