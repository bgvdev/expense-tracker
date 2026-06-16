<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class PasswordResetMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(public readonly string $otp) {}

    public function envelope(): Envelope
    {
        return new Envelope(subject: 'Your Expense Tracker Password Reset OTP');
    }

    public function content(): Content
    {
        return new Content(
            markdown: 'emails.password-reset',
            with: ['otp' => $this->otp],
        );
    }
}
