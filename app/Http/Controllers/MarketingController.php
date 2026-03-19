<?php

namespace App\Http\Controllers;

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

class MarketingController extends Controller
{
    public function home()
    {
        return Inertia::render('Marketing/Home', [
            'canLogin'    => Route::has('login'),
            'canRegister' => Route::has('register'),
        ]);
    }

    public function howItWorks()
    {
        return Inertia::render('Marketing/HowItWorks', [
            'canLogin'    => Route::has('login'),
            'canRegister' => Route::has('register'),
        ]);
    }

    public function pricing()
    {
        return Inertia::render('Marketing/Pricing', [
            'canLogin'    => Route::has('login'),
            'canRegister' => Route::has('register'),
        ]);
    }
}
