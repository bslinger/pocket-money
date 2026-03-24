<?php

namespace App\Notifications;

class TransactionRecorded extends BaseNotification
{
    protected function title(): string
    {
        return 'Quiddo';
    }

    protected function body(): string
    {
        return 'A transaction was recorded on an account';
    }

    protected function deepLink(): string
    {
        return 'quiddo://';
    }
}
