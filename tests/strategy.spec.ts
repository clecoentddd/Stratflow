
import { test, expect } from '@playwright/test';

test.describe('Strategy and Initiative Management', () => {

  test('should not create an empty initiative item when blurring an empty input', async ({ page }) => {
    // Navigate to the Demo Company's first organization's strategy page.
    await page.goto('/');
    
    // Find the link to the Demo Company and click it.
    await page.getByRole('link', { name: 'View Organizations' }).first().click();

    // Find the first organization and navigate to its strategy dashboard
    await page.getByRole('button', { name: 'View Strategy Dashboard' }).first().click();
    await expect(page).toHaveURL(/.*\/organization\/org-.*/);
    
    const strategyDescription = 'Develop and launch the new \'Innovate\' feature set.';
    const initiativeName = 'Market Research & Analysis';

    // Find and expand the correct strategy
    const strategyAccordion = page.getByText(strategyDescription);
    await strategyAccordion.click();

    // Find and expand the initiative
    const initiativeAccordion = page.getByRole('button', { name: initiativeName });
    await initiativeAccordion.click();

    // Find the "Diagnostic" step and count its items before adding a new one
    const diagnosticCard = page.locator('div.h-full:has-text("Diagnostic")');
    const initialItemCount = await diagnosticCard.locator('.block').count();
    
    // Click the '+' button to add a new item
    await diagnosticCard.getByRole('button', { name: 'Add' }).click();

    // A textarea should now be visible.
    const newItemTextarea = diagnosticCard.getByPlaceholder('Describe an item...');
    await expect(newItemTextarea).toBeVisible();

    // Click outside the textarea to trigger the blur event, without typing anything.
    await diagnosticCard.click();
    
    // The textarea should disappear.
    await expect(newItemTextarea).not.toBeVisible();
    
    // The number of items should be the same as before.
    const finalItemCount = await diagnosticCard.locator('.block').count();
    expect(finalItemCount).toBe(initialItemCount);
  });

});
