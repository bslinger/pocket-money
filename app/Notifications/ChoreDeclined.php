<?php

namespace App\Notifications;

class ChoreDeclined extends BaseNotification
{
    protected function title(): string
    {
        return 'Quiddo';
    }

    protected function body(): string
    {
        return 'A chore needs your attention';
    }

    protected function deepLink(): string
    {
        return 'quiddo://';
    }
}
