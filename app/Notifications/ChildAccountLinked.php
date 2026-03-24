<?php

namespace App\Notifications;

class ChildAccountLinked extends BaseNotification
{
    protected function title(): string
    {
        return 'Quiddo';
    }

    protected function body(): string
    {
        return 'A child account was linked';
    }

    protected function deepLink(): string
    {
        return 'quiddo://';
    }
}
