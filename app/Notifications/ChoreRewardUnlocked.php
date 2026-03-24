<?php

namespace App\Notifications;

class ChoreRewardUnlocked extends BaseNotification
{
    protected function title(): string
    {
        return 'Quiddo';
    }

    protected function body(): string
    {
        return 'You unlocked a reward!';
    }

    protected function deepLink(): string
    {
        return 'quiddo://';
    }
}
