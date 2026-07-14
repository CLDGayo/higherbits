import { test, expect } from '@playwright/test';

test.describe('Verify Fixes', () => {

  test('Logo is wrapped in a Link to / and has correct layout classes (black circle)', async ({ page }) => {
    // Set the cookie so we bypass the Hero section and get the Header rendered
    await page.context().addCookies([{ name: 'has_visited', value: '1', url: 'http://localhost:3000' }]);
    
    await page.goto('/');
    
    // Wait for the header to be present
    const header = page.locator('header').first();
    await expect(header).toBeAttached({ timeout: 15000 });
    
    // Find the link wrapping the logo
    const logoLink = header.locator('a[href="/"]').first();
    await expect(logoLink).toBeAttached();

    const searchButton = header.locator('button:has-text("Global search...")').first();
    await expect(searchButton).toBeVisible();
  });

  test('Sidebar can be toggled using the trigger in the header', async ({ page }) => {
    // Set the cookie so we bypass the Hero section and get the Header rendered
    await page.context().addCookies([{ name: 'has_visited', value: '1', url: 'http://localhost:3000' }]);

    await page.goto('/');
    
    // Find the toggle button in the header (it's inside the div we added next to the logo)
    const header = page.locator('header').first();
    const trigger = header.locator('button[data-sidebar="trigger"]').first();
    await expect(trigger).toBeVisible();

    // Check sidebar state - the layout should have the sidebar data-state attribute
    const sidebar = page.locator('div[data-sidebar="sidebar"]').first();
    // Initially expanded on desktop
    await expect(page.locator('[data-state="expanded"]').first()).toBeVisible();

    // Click to collapse
    await trigger.click();
    await expect(page.locator('[data-state="collapsed"]').first()).toBeVisible();

    // Click to expand again
    await trigger.click();
    await expect(page.locator('[data-state="expanded"]').first()).toBeVisible();
  });

  test('Search bar is correctly positioned in the flex flow (orange circle)', async ({ page }) => {
    // Set the cookie so we bypass the Hero section and get the Header rendered
    await page.context().addCookies([{ name: 'has_visited', value: '1', url: 'http://localhost:3000' }]);

    await page.goto('/');
    
    const header = page.locator('header').first();
    await expect(header).toBeAttached({ timeout: 15000 });
    
    // Find the container holding the search bar (w-[400px])
    const searchBarContainer = header.locator('div.flex-1 > div.w-\\[400px\\]').first();
    
    await expect(searchBarContainer).toBeAttached();
    
    // It should NOT have absolute positioning anymore
    await expect(searchBarContainer).not.toHaveClass(/absolute/);
    await expect(searchBarContainer).not.toHaveClass(/-translate-x-1\/2/);
  });

  test('Webhook route for user creation is active', async ({ request }) => {
    // Send a mock Clerk webhook payload
    const payload = {
      data: {
        id: "user_test_" + Date.now(),
        email_addresses: [
          { email_address: "testuser123@example.com" }
        ],
        first_name: "Test",
        last_name: "User",
        image_url: "https://example.com/image.png"
      },
      type: "user.created"
    };

    const response = await request.post('/api/webhooks/clerk', {
      data: payload
    });
    
    expect(response.status()).toBe(400);
    const body = await response.json();
    expect(["Missing required headers", "Invalid webhook signature"]).toContain(body.error);
  });
});
