<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Expense extends Model
{
    use HasFactory;

    protected $table = 'expense';

    protected $fillable = [
        'user_id',
        'category_id',
        'amount',
        'description',
        'spent_at',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'spent_at' => 'datetime',
            'amount' => 'decimal:2',
        ];
    }

    /**
     * Get the user that owns the expense.
     */
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get the category that the expense belongs to.
     */
    public function category()
    {
        return $this->belongsTo(Category::class);
    }
}
