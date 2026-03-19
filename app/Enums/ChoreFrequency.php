<?php

namespace App\Enums;

enum ChoreFrequency: string
{
    case Daily = 'daily';
    case Weekly = 'weekly';
    case Monthly = 'monthly';
    case OneOff = 'one_off';
}
