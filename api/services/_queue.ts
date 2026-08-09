import { QueueClient } from "@vercel/queue";

/**
 * The queue client used to publish contact messages.
 *
 * By default the SDK pins each published message to `VERCEL_DEPLOYMENT_ID`, so
 * the consumer that runs is the one built from the same commit as the producer.
 * That is what you want in a deployment, and it is why the default is left
 * alone there.
 *
 * Locally there is no deployment to pin to — `VERCEL_DEPLOYMENT_ID` is injected
 * into deployments, not into `vercel dev` — and the SDK throws rather than
 * guessing. `deploymentId: null` opts out explicitly, so publishing works from
 * a dev server too.
 *
 * Worth knowing when testing locally: an unpinned message still goes to the
 * real topic, and the consumer that picks it up is the deployed one. A local
 * submission therefore sends a real email.
 */
const client = new QueueClient(
  process.env.VERCEL_DEPLOYMENT_ID ? {} : { deploymentId: null },
);

export const { send } = client;
