@component('mail::message')
# Welcome to Expense Tracker, {{ $user->name }}!

Thanks for signing up. You can now start tracking your expenses, organising them by category, and viewing spending insights.

@component('mail::button', ['url' => env('FRONTEND_URL', 'http://localhost:3000')])
Go to Expense Tracker
@endcomponent

If you didn't create an account, you can safely ignore this email.

Thanks,<br>
The Expense Tracker Team
@endcomponent
