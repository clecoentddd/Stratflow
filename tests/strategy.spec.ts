
import { test, expect } from '@playwright/test';

test.describe('Strategy and Initiative Management', () => {

  // Use a beforeEach hook to navigate to the correct page before each test.
  test.beforeEach(async ({ page }) => {
    // Navigate to the Demo Company's organizations page.
    await page.goto('/');
    await page.getByRole('link', { name: 'View Organizations' }).first().click();
    await expect(page).toHaveURL(/.*\/company\/company-demo\/organizations/);
    
    // Navigate to the CTO organization's strategy dashboard
    const ctoCard = page.locator('div.flex.flex-col.bg-card:has-text("CTO")');
    await ctoCard.getByRole('button', { name: 'View Strategy Dashboard' }).click();
    await expect(page).toHaveURL(/.*\/organization\/org-cto/);
  });

  test('should create an initiative for a strategy', async ({ page }) => {
    // Find the strategy card we want to add an initiative to
    const strategyDescription = 'Develop and launch the new \'Innovate\' feature set.';
    const strategyCard = page.locator(`div.transition-opacity:has-text("${strategyDescription}")`);
    await expect(strategyCard).toBeVisible();

    // Type a name for the new initiative
    const newInitiativeName = 'A Brand New Initiative';
    await strategyCard.getByPlaceholder('Name your new initiative...').fill(newInitiativeName);

    // Click the "Add Initiative" button
    await strategyCard.getByRole('button', { name: 'Add Initiative' }).click();

    // Assert that the new initiative now appears on the page as an accordion trigger
    const newInitiativeAccordion = page.getByRole('button', { name: newInitiativeName });
    await expect(newInitiativeAccordion).toBeVisible();
  });

});
