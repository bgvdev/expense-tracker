<?php

use App\Http\Middleware\AdminMiddleware;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;
use Sentry\Laravel\Integration;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->alias([
            'admin' => AdminMiddleware::class,
        ]);

        // Laravel does not apply a limiter to API routes unless one is named and
        // attached. Without this, every authenticated endpoint was unthrottled —
        // only the public auth group had a throttle.
        $middleware->api(prepend: ['throttle:api']);
    })
    ->booted(function (): void {
        // Keyed by authenticated user where possible so that several users behind
        // one NAT/proxy do not share a budget; falls back to IP for guests.
        // Reads config (not env) so it survives config:cache.
        RateLimiter::for('api', fn (Request $request) => Limit::perMinute(
            (int) config('app.api_rate_limit')
        )->by($request->user()?->id ?: $request->ip()));
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        // Report unhandled exceptions to Sentry. No-op when SENTRY_LARAVEL_DSN
        // is empty, so local/test runs stay quiet.
        Integration::handles($exceptions);
    })->create();
