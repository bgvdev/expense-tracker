<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\ForgotPasswordRequest;
use App\Http\Requests\LoginRequest;
use App\Http\Requests\RegisterRequest;
use App\Http\Requests\ResetPasswordRequest;
use App\Http\Requests\UpdatePasswordRequest;
use App\Http\Requests\UpdateProfileRequest;
use App\Mail\PasswordResetMail;
use App\Mail\WelcomeMail;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;

use function Illuminate\Support\defer;

class AuthController extends Controller
{
    /** Incorrect OTP submissions allowed before the reset token is discarded. */
    private const MAX_OTP_ATTEMPTS = 5;

    public function register(RegisterRequest $request): JsonResponse
    {
        $user  = User::create($request->validated());
        $token = $user->createToken('api-token')->plainTextToken;

        // Deferred: an SMTP handshake with Gmail costs the caller seconds of
        // latency for something they do not wait on. Symfony's Response::send()
        // calls fastcgi_finish_request(), so deferred callbacks run after the
        // response has already reached the client.
        defer(function () use ($user) {
            try {
                Mail::to($user)->send(new WelcomeMail($user));
            } catch (\Throwable) {
                // Mail failure must never break registration
            }
        });

        return response()->json([
            'token' => $token,
            'user'  => ['id' => $user->id, 'name' => $user->name, 'email' => $user->email, 'is_admin' => (bool) $user->is_admin],
        ], 201);
    }

    public function login(LoginRequest $request): JsonResponse
    {
        if (! Auth::attempt($request->only('email', 'password'))) {
            return response()->json([
                'message' => 'Invalid credentials. Please check your email and password.',
            ], 401);
        }

        /** @var User $user */
        $user  = Auth::user();
        $token = $user->createToken('api-token')->plainTextToken;

        return response()->json([
            'token' => $token,
            'user'  => ['id' => $user->id, 'name' => $user->name, 'email' => $user->email, 'is_admin' => (bool) $user->is_admin],
        ]);
    }

    public function logout(Request $request): JsonResponse
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json(['message' => 'Logged out successfully.']);
    }

    public function me(Request $request): JsonResponse
    {
        $user = $request->user();

        return response()->json([
            'id'       => $user->id,
            'name'     => $user->name,
            'email'    => $user->email,
            'is_admin' => (bool) $user->is_admin,
        ]);
    }

    public function updateProfile(UpdateProfileRequest $request): JsonResponse
    {
        $user      = $request->user();
        $validated = $request->validated();

        // Changing the email invalidates any prior verification of it. Set
        // directly rather than via update() — email_verified_at is deliberately
        // not mass-assignable.
        if (array_key_exists('email', $validated) && $validated['email'] !== $user->email) {
            $user->email_verified_at = null;
        }

        $user->fill($validated)->save();

        // is_admin must be included: the client replaces its whole user object
        // with this response, so omitting it silently strips admin rights.
        return response()->json([
            'id'       => $user->id,
            'name'     => $user->name,
            'email'    => $user->email,
            'is_admin' => (bool) $user->is_admin,
        ]);
    }

    public function updatePassword(UpdatePasswordRequest $request): JsonResponse
    {
        $user = $request->user();

        if (! Hash::check($request->current_password, $user->password)) {
            return response()->json([
                'message' => 'Current password is incorrect.',
                'errors'  => ['current_password' => ['Current password is incorrect.']],
            ], 422);
        }

        $user->update(['password' => $request->new_password]);

        // Revoke every existing token, then re-issue one for this session.
        // Without this a stolen bearer token survived the password change.
        $user->tokens()->delete();
        $token = $user->createToken('api-token')->plainTextToken;

        return response()->json([
            'message' => 'Password updated successfully.',
            'token'   => $token,
        ]);
    }

    public function forgotPassword(ForgotPasswordRequest $request): JsonResponse
    {
        $genericMessage = 'If an account exists for that email, an OTP has been sent.';

        $user = User::where('email', $request->email)->first();

        if (! $user) {
            return response()->json(['message' => $genericMessage]);
        }

        $otp = (string) random_int(100000, 999999);

        DB::table('password_reset_tokens')->updateOrInsert(
            ['email' => $user->email],
            // attempts resets to 0: a newly requested OTP starts with a full budget.
            ['token' => Hash::make($otp), 'created_at' => now(), 'attempts' => 0],
        );

        // Deferred for the same reason as the welcome mail in register(): the
        // response is a fixed generic message either way, so blocking it on the
        // SMTP round trip only slows the caller down.
        defer(function () use ($user, $otp) {
            try {
                Mail::to($user)->send(new PasswordResetMail($otp));
            } catch (\Throwable) {
                // Mail failure should not expose internal errors
            }
        });

        return response()->json(['message' => $genericMessage]);
    }

    public function resetPassword(ResetPasswordRequest $request): JsonResponse
    {
        $row = DB::table('password_reset_tokens')
            ->where('email', $request->email)
            ->first();

        if (! $row) {
            return response()->json([
                'message' => 'Invalid or expired OTP.',
                'errors'  => ['otp' => ['Invalid or expired OTP.']],
            ], 422);
        }

        if (Carbon::parse($row->created_at)->addMinutes(15)->isPast()) {
            DB::table('password_reset_tokens')->where('email', $request->email)->delete();

            return response()->json([
                'message' => 'OTP has expired.',
                'errors'  => ['otp' => ['OTP has expired.']],
            ], 422);
        }

        if (! Hash::check($request->otp, $row->token)) {
            // Per-account attempt limit. The shared per-IP throttle on the auth
            // group is not enough on its own: it is one bucket for login and
            // reset together, and it does not stop a distributed guessing attempt
            // against a single account. A 6-digit OTP is only 10^6 wide.
            $attempts = ($row->attempts ?? 0) + 1;

            if ($attempts >= self::MAX_OTP_ATTEMPTS) {
                DB::table('password_reset_tokens')->where('email', $request->email)->delete();

                return response()->json([
                    'message' => 'Too many incorrect attempts. Please request a new OTP.',
                    'errors'  => ['otp' => ['Too many incorrect attempts. Please request a new OTP.']],
                ], 422);
            }

            DB::table('password_reset_tokens')
                ->where('email', $request->email)
                ->update(['attempts' => $attempts]);

            return response()->json([
                'message' => 'Invalid or expired OTP.',
                'errors'  => ['otp' => ['Invalid or expired OTP.']],
            ], 422);
        }

        $user = User::where('email', $request->email)->first();
        $user->update(['password' => $request->password]);

        // Anyone holding a token issued before the reset must be locked out —
        // that is the whole point of resetting a possibly-compromised password.
        $user->tokens()->delete();

        DB::table('password_reset_tokens')->where('email', $request->email)->delete();

        return response()->json(['message' => 'Password reset successfully.']);
    }
}
