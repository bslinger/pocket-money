<?php

namespace App\Mail;

use App\Models\BillingTransferInvitation;
use App\Models\Family;
use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class BillingTransferMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public readonly BillingTransferInvitation $invitation,
    ) {}

    public function envelope(): Envelope
    {
        /** @var User $fromUser */
        $fromUser = $this->invitation->fromUser;
        $fromName = $fromUser->display_name ?? $fromUser->name;

        /** @var Family $family */
        $family = $this->invitation->family;

        return new Envelope(
            subject: "{$fromName} wants to transfer billing for {$family->name} to you",
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.billing-transfer',
        );
    }

    public function attachments(): array
    {
        return [];
    }
}
