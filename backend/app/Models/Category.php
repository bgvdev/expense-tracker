<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class Category extends Model
{
    use HasFactory;

    protected $table = 'category';

    protected $fillable = ['user_id', 'name', 'slug', 'icon', 'color'];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function expenses()
    {
        return $this->hasMany(Expense::class);
    }

    public function scopeAccessibleBy($query, int $userId)
    {
        return $query->where(function ($q) use ($userId) {
            $q->whereNull('user_id')->orWhere('user_id', $userId);
        });
    }

    /**
     * Build a globally-unique slug from a category name.
     *
     * `category.slug` carries a global unique index, so a candidate must be
     * checked against every row — not just the ones the current user can see.
     * Scoping this to accessibleBy() let one user's slug collide with another
     * user's and surface as an unhandled QueryException.
     */
    public static function uniqueSlug(string $name): string
    {
        // Str::slug() returns '' for names with no transliterable characters
        // (e.g. "日本"), which would otherwise insert an empty slug.
        $base = Str::slug($name) ?: 'category';
        $slug = $base;
        $i    = 1;

        while (static::where('slug', $slug)->exists()) {
            $slug = "{$base}-{$i}";
            $i++;
        }

        return $slug;
    }
}
