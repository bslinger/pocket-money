<?php

namespace App\Enums;

enum TxType: string
{
    case Credit = 'credit';
    case Debit = 'debit';
}
