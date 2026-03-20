<?php

namespace App\Http\Controllers;

abstract class Controller
{
    /**
     * Return the active family ID from the session, used to scope queries to the
     * currently selected family context.
     */
    protected function activeFamilyId(): ?string
    {
        return session('active_family_id');
    }
}
