import { test, expect } from '@playwright/test';
import { getRiskColor, getRiskView, RADAR_DEFAULT_RISK, radarRiskPalette, radarTooltipCopy, radarTooltipLabels } from '../src/lib/radar/viewModel';

test.describe('radar view model', () => {
  test('returns consistent palette entries for each risk level', () => {
    (Object.keys(radarRiskPalette) as Array<keyof typeof radarRiskPalette>).forEach(level => {
      const view = getRiskView(level);
      expect(view.level).toBe(level);
      expect(view.color).toBe(radarRiskPalette[level].color);
      expect(getRiskColor(level)).toBe(view.color);
    });
  });

  test('falls back to default risk when none provided', () => {
    const view = getRiskView();
    expect(view.level).toBe(RADAR_DEFAULT_RISK);
    expect(view.color).toBe(radarRiskPalette[RADAR_DEFAULT_RISK].color);
  });

  test('exposes tooltip copy for UI reuse', () => {
    expect(radarTooltipLabels.risk).toBe('Risk:');
    expect(radarTooltipCopy.placeholder.length).toBeGreaterThan(0);
  });
});
