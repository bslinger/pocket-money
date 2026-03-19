<?php

namespace App\Enums;

enum ChoreRewardType: string
{
    case Earns = 'earns';
    case Responsibility = 'responsibility';
    case NoReward = 'no_reward';
}
