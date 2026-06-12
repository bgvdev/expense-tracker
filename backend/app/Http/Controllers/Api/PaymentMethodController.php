<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\PaymentMethod;
use Illuminate\Http\JsonResponse;

class PaymentMethodController extends Controller
{
    public function index(): JsonResponse
    {
        return response()->json(PaymentMethod::orderBy('id')->get(['id', 'name', 'slug']));
    }
}
