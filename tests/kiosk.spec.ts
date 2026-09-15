import { test, expect } from '@playwright/test';

for (const [width, height] of [[768,1024], [1024,768], [1280,800], [820,1180], [360,800]]) {
  test(`Interfaz táctil ${width}×${height}`, async ({ page }) => {
    await page.setViewportSize({ width, height });
    const errors: string[] = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto('./');
    await expect(page.getByRole('button', { name: 'Configuración', exact: true })).toHaveCount(0);
    expect((await page.locator('header').boundingBox())!.height).toBeLessThanOrEqual(56);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    if (width >= 768) expect(await page.evaluate(() => document.documentElement.scrollHeight <= innerHeight + 1)).toBe(true);
    for (const button of await page.locator('.route-card').all()) expect((await button.boundingBox())!.height).toBeGreaterThanOrEqual(44);
    await page.getByRole('button', { name: /Quiero orientación/ }).click();
    await page.getByRole('button', { name: /^No\b/ }).click();
    await page.getByRole('button', { name: /Todavía no lo sé/ }).click();
    // Four choices is the tallest question.
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    if (width >= 768) expect(await page.evaluate(() => document.documentElement.scrollHeight <= innerHeight + 1)).toBe(true);
    await page.getByRole('button', { name: /Todavía no lo sé/ }).click();
    await expect(page.getByRole('button', { name: /Pagar en cuotas y esperar para retirar el vehículo/ })).toBeVisible();
    if (width === 1024) await page.screenshot({ path: 'test-results/tablet-question.png', fullPage: true });
    await page.getByRole('button', { name: /Quiero conocer ambas alternativas/ }).click();
    await expect(page.getByRole('heading', { name: '¿Qué opción querés consultar primero?' })).toBeVisible();
    expect(await page.evaluate(() => Object.keys(localStorage).filter(k => k.startsWith('AUTOSOL_PENDIENTE_')).length)).toBe(0);
    await page.getByRole('button', { name: /Planes de ahorro/ }).click();
    await expect(page.getByRole('heading', { name: 'Planes de ahorro' })).toBeVisible();
    await expect(page.getByText('¡Gracias por visitarnos!')).toBeVisible();
    expect(await page.evaluate(() => Object.keys(localStorage).filter(k => k.startsWith('AUTOSOL_PENDIENTE_')).length)).toBe(1);
    expect(errors).toEqual([]);
  });
}

test('Una sola derivación, cierre automático y nuevo cliente independiente', async ({ page }) => {
  await page.clock.install();
  await page.goto('./');
  await page.getByRole('button', { name: /Venta directa/ }).click();
  await expect(page.getByRole('heading', { name: 'Venta tradicional' })).toBeVisible();
  await page.clock.fastForward(20000);
  await expect(page.getByRole('button', { name: /Quiero orientación/ })).toBeVisible();
  await page.getByRole('button', { name: /Plan de ahorro/ }).click();
  const entries = await page.evaluate(() => Object.keys(localStorage).filter(k => k.startsWith('AUTOSOL_PENDIENTE_')).map(k => JSON.parse(localStorage.getItem(k)!)));
  expect(entries).toHaveLength(2);
  expect(new Set(entries.map(e => e.id)).size).toBe(2);
  expect(entries.map(e => e.tipo).sort()).toEqual(['Planes', 'Tradicional']);
});

test('Un envío no confirmado persiste y se reintenta con el mismo identificador', async ({ page }) => {
  const url = 'https://script.google.com/macros/s/test-registration/exec';
  await page.addInitScript(({ url }) => localStorage.setItem('AUTOSOL_REGISTRO_CONEXION', JSON.stringify({ url, key: 'test-key-for-browser-at-least-32-chars' })), { url });
  const sent: any[] = [];
  let succeed = false;
  await page.route(url, async route => {
    const body = route.request().postDataJSON(); sent.push(body);
    if (!succeed) await route.fulfill({ json: { ok: false, error: 'busy' } });
    else await route.fulfill({ json: { ok: true, id: body.id, cliente: 'Cliente 1', asesor: '' } });
  });
  await page.goto('./');
  await page.getByRole('button', { name: /Venta directa/ }).click();
  await expect.poll(() => sent.length).toBe(1);
  expect(await page.evaluate(() => Object.keys(localStorage).filter(k => k.startsWith('AUTOSOL_PENDIENTE_')).length)).toBe(1);
  succeed = true;
  await page.reload();
  await expect.poll(() => sent.length).toBe(2);
  expect(sent[0].id).toBe(sent[1].id);
  await expect.poll(() => page.evaluate(() => Object.keys(localStorage).filter(k => k.startsWith('AUTOSOL_PENDIENTE_')).length)).toBe(0);
});
