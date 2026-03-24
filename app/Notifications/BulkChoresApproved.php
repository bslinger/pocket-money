<?php

namespace App\Notifications;

class BulkChoresApproved extends BaseNotification
{
    protected function title(): string
    {
        return 'Quiddo';
    }

    protected function body(): string
    {
        return 'Your chores were approved!';
    }

    protected function deepLink(): string
    {
        return 'quiddo://';
    }
}
