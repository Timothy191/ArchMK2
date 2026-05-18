import { Svix, EndpointIn, EndpointOut, ApplicationIn, ApplicationOut } from "svix";

/**
 * Create a Svix client instance for webhook management
 * Uses SVIX_API_KEY from environment variables
 */
export function createSvixClient(): Svix {
  const apiKey = process.env.SVIX_API_KEY;
  
  if (!apiKey) {
    throw new Error("SVIX_API_KEY environment variable is not set");
  }

  return new Svix(apiKey);
}

/**
 * Create a new webhook endpoint
 */
export async function createWebhookEndpoint(
  applicationId: string,
  endpoint: EndpointIn
): Promise<EndpointOut> {
  const svix = createSvixClient();
  return await svix.endpoint.create(applicationId, endpoint);
}

/**
 * List webhook endpoints for an application
 */
export async function listWebhookEndpoints(
  applicationId: string
): Promise<EndpointOut[]> {
  const svix = createSvixClient();
  const endpoints = await svix.endpoint.list(applicationId);
  return endpoints.data;
}

/**
 * Delete a webhook endpoint
 */
export async function deleteWebhookEndpoint(
  applicationId: string,
  endpointId: string
): Promise<void> {
  const svix = createSvixClient();
  await svix.endpoint.delete(applicationId, endpointId);
}

/**
 * Create a new Svix application
 */
export async function createApplication(
  application: ApplicationIn
): Promise<ApplicationOut> {
  const svix = createSvixClient();
  return await svix.application.create(application);
}

/**
 * Get or create an application by name
 */
export async function getOrCreateApplication(
  name: string
): Promise<ApplicationOut> {
  const svix = createSvixClient();
  
  try {
    // Try to get existing application
    const applications = await svix.application.list();
    const existing = applications.data.find((app: ApplicationOut) => app.name === name);
    
    if (existing) {
      return existing;
    }
    
    // Create new application if it doesn't exist
    return await svix.application.create({ name });
  } catch (error) {
    console.error("Error getting or creating application:", error);
    throw error;
  }
}

/**
 * Send an event through Svix
 */
export async function sendEvent(
  applicationId: string,
  eventType: string,
  payload: Record<string, unknown>
): Promise<void> {
  const svix = createSvixClient();
  await svix.message.create(applicationId, {
    eventType,
    payload,
  });
}
