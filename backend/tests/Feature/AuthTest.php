<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class AuthTest extends TestCase
{
    use RefreshDatabase;

    public function test_register_creates_user_and_returns_token(): void
    {
        $response = $this->postJson('/api/auth/register', [
            'name'                  => 'Jane Doe',
            'email'                 => 'jane@example.com',
            'password'              => 'password123',
            'password_confirmation' => 'password123',
        ]);

        $response->assertCreated()
            ->assertJsonStructure(['token', 'user' => ['id', 'name', 'email']]);

        $this->assertDatabaseHas('user', ['email' => 'jane@example.com']);
    }

    public function test_register_rejects_duplicate_email(): void
    {
        User::factory()->create(['email' => 'taken@example.com']);

        $this->postJson('/api/auth/register', [
            'name'                  => 'Someone',
            'email'                 => 'taken@example.com',
            'password'              => 'password123',
            'password_confirmation' => 'password123',
        ])->assertStatus(422)->assertJsonValidationErrors('email');
    }

    public function test_login_returns_token_with_valid_credentials(): void
    {
        User::factory()->create([
            'email'    => 'user@example.com',
            'password' => Hash::make('secret123'),
        ]);

        $this->postJson('/api/auth/login', [
            'email'    => 'user@example.com',
            'password' => 'secret123',
        ])->assertOk()->assertJsonStructure(['token', 'user' => ['id', 'name', 'email']]);
    }

    public function test_login_rejects_invalid_credentials(): void
    {
        User::factory()->create([
            'email'    => 'user@example.com',
            'password' => Hash::make('secret123'),
        ]);

        $this->postJson('/api/auth/login', [
            'email'    => 'user@example.com',
            'password' => 'wrong-password',
        ])->assertStatus(401);
    }

    public function test_me_returns_authenticated_user(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user)
            ->getJson('/api/auth/me')
            ->assertOk()
            ->assertJson(['id' => $user->id, 'email' => $user->email]);
    }

    public function test_me_requires_authentication(): void
    {
        $this->getJson('/api/auth/me')->assertUnauthorized();
    }

    public function test_logout_revokes_current_token(): void
    {
        $user  = User::factory()->create();
        $token = $user->createToken('api-token')->plainTextToken;

        $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson('/api/auth/logout')
            ->assertOk();

        $this->assertCount(0, $user->fresh()->tokens);
    }
}
