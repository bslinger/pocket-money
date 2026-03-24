<?php

namespace App\Notifications;

class SavingsGoalReached extends BaseNotification
{
    protected function title(): string
    {
        return 'Quiddo';
    }

    protected function body(): string
    {
        return 'A savings goal was reached!';
    }

    protected function deepLink(): string
    {
        return 'quiddo://goals';
    }
}
