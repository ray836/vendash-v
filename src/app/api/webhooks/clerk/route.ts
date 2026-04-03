import { Webhook } from 'svix';
import { headers } from 'next/headers';
import { WebhookEvent } from '@clerk/nextjs/server';
import { db } from '@/infrastructure/database';
import { users } from '@/infrastructure/database/schema';
import { eq } from 'drizzle-orm';

/**
 * POST /api/webhooks/clerk
 * Handles Clerk webhook events to sync user data to PostgreSQL
 *
 * Events handled:
 * - user.created: Creates new user in database with clerkId
 * - user.updated: Updates user information (name, email)
 * - user.deleted: Marks user as deleted or removes clerkId
 */
export async function POST(req: Request) {
  // Get the headers
  const headerPayload = await headers();
  const svix_id = headerPayload.get('svix-id');
  const svix_timestamp = headerPayload.get('svix-timestamp');
  const svix_signature = headerPayload.get('svix-signature');

  // If there are no headers, error out
  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new Response('Error occurred -- no svix headers', {
      status: 400,
    });
  }

  // Get the body
  const payload = await req.json();
  const body = JSON.stringify(payload);

  // Create a new Svix instance with your webhook secret
  const webhookSecret = process.env.CLERK_WEBHOOK_SECRET;

  if (!webhookSecret) {
    console.error('⚠️  CLERK_WEBHOOK_SECRET is not set');
    return new Response('Error occurred -- webhook secret not configured', {
      status: 500,
    });
  }

  const wh = new Webhook(webhookSecret);

  let evt: WebhookEvent;

  // Verify the payload with the headers
  try {
    evt = wh.verify(body, {
      'svix-id': svix_id,
      'svix-timestamp': svix_timestamp,
      'svix-signature': svix_signature,
    }) as WebhookEvent;
  } catch (err) {
    console.error('❌ Error verifying webhook:', err);
    return new Response('Error occurred -- invalid signature', {
      status: 400,
    });
  }

  // Handle the webhook event
  const eventType = evt.type;
  console.log(`🔔 Clerk webhook received: ${eventType}`);

  try {
    switch (eventType) {
      case 'user.created': {
        // User creation is handled during the onboarding flow, where the user
        // sets up their organization. We don't create a DB record here because
        // we don't have an organizationId yet.
        const { id: clerkId, email_addresses } = evt.data;
        const primaryEmail = email_addresses.find((e) => e.id === evt.data.primary_email_address_id);
        console.log(`ℹ️  New Clerk user signed up: ${primaryEmail?.email_address} (${clerkId}) — awaiting onboarding`);
        break;
      }

      case 'user.updated': {
        const { id: clerkId, email_addresses, first_name, last_name } = evt.data;

        const primaryEmail = email_addresses.find((e) => e.id === evt.data.primary_email_address_id);

        if (!primaryEmail) {
          console.error('❌ No primary email found for user');
          return new Response('Error: No primary email', { status: 400 });
        }

        // Update user in database
        await db
          .update(users)
          .set({
            firstName: first_name || '',
            lastName: last_name || '',
            email: primaryEmail.email_address,
          })
          .where(eq(users.clerkId, clerkId));

        console.log(`✅ Updated user in database: ${primaryEmail.email_address} (${clerkId})`);
        break;
      }

      case 'user.deleted': {
        const { id: clerkId } = evt.data;

        // Option 1: Remove clerkId (soft delete - user record remains)
        await db
          .update(users)
          .set({
            clerkId: null,
          })
          .where(eq(users.clerkId, clerkId!));

        console.log(`✅ Removed clerkId from user: ${clerkId}`);

        // Option 2: Hard delete (uncomment if preferred)
        // await db.delete(users).where(eq(users.clerkId, clerkId!));
        // console.log(`✅ Deleted user from database: ${clerkId}`);

        break;
      }

      default:
        console.log(`ℹ️  Unhandled event type: ${eventType}`);
    }

    return new Response('Webhook processed successfully', { status: 200 });
  } catch (error) {
    console.error('❌ Error processing webhook:', error);
    return new Response('Error processing webhook', { status: 500 });
  }
}
