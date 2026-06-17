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

class AuthController extends Controller
{
    public function register(RegisterRequest $request): JsonResponse
    {
        $user  = User::create($request->validated());
        $token = $user->createToken('api-token')->plainTextToken;

        try {
            Mail::to($user)->send(new WelcomeMail($user));
        } catch (\Throwable) {
            // Mail failure must never break registration
        }

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
        $user = $request->user();
        $user->update($request->validated());

        return response()->json([
            'id'    => $user->id,
            'name'  => $user->name,
            'email' => $user->email,
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

        return response()->json(['message' => 'Password updated successfully.']);
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
            ['token' => Hash::make($otp), 'created_at' => now()],
        );

        try {
            Mail::to($user)->send(new PasswordResetMail($otp));
        } catch (\Throwable) {
            // Mail failure should not expose internal errors
        }

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
            return response()->json([
                'message' => 'Invalid or expired OTP.',
                'errors'  => ['otp' => ['Invalid or expired OTP.']],
            ], 422);
        }

        $user = User::where('email', $request->email)->first();
        $user->update(['password' => $request->password]);

        DB::table('password_reset_tokens')->where('email', $request->email)->delete();

        return response()->json(['message' => 'Password reset successfully.']);
    }
}
