<?php

namespace App\Notifications;

class PocketMoneyReceived extends BaseNotification
{
    protected function title(): string
    {
        return 'Quiddo';
    }

    protected function body(): string
    {
        return 'Pocket money received!';
    }

    protected function deepLink(): string
    {
        return 'quiddo://';
    }
}
