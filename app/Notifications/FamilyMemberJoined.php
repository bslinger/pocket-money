<?php

namespace App\Notifications;

class FamilyMemberJoined extends BaseNotification
{
    protected function title(): string
    {
        return 'Quiddo';
    }

    protected function body(): string
    {
        return 'Someone joined your family';
    }

    protected function deepLink(): string
    {
        return 'quiddo://';
    }
}
