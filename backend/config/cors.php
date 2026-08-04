<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Cross-Origin Resource Sharing (CORS) Configuration
    |--------------------------------------------------------------------------
    |
    | Here you may configure your settings for cross-origin resource sharing
    | or "CORS". This determines what cross-origin operations may execute
    | in web browsers. You are free to adjust these settings as needed.
    |
    | To learn more: https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS
    |
    */

    /*
    | This is a stateless Bearer-token API: the frontend calls same-origin
    | /api/* paths through the Next.js rewrite, so CORS is a fallback rather than
    | the primary path. These values are therefore deliberately narrow.
    */

    'paths' => ['api/*'],

    'allowed_methods' => ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],

    // No production default. Previously this fell back to the production origin,
    // so an environment that simply forgot to set the variable silently trusted
    // the production frontend. An empty list allows nothing.
    'allowed_origins' => array_values(array_filter(
        array_map('trim', explode(',', (string) env('CORS_ALLOWED_ORIGINS', '')))
    )),

    'allowed_origins_patterns' => [],

    'allowed_headers' => ['Accept', 'Authorization', 'Content-Type', 'X-Requested-With'],

    'exposed_headers' => [],

    'max_age' => 3600,

    // No cookies are used anywhere (see CLAUDE.md: "No cookies, no CSRF"), and
    // credentialed requests are incompatible with a wildcard origin.
    'supports_credentials' => false,

];
