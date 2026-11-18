import { test, expect } from '@playwright/test';

test.describe('Página inicial', () => {
  test('oferece link de autenticação', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText('Entrar')).toBeVisible();
  });
});

test.describe('Página de login', () => {
  test('apresenta campos acessíveis', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByLabel('E-mail')).toBeVisible();
    await expect(page.getByLabel('Senha')).toBeVisible();
  });

  test('exibe erro com credenciais inválidas', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel('E-mail').fill('invalido@example.com');
    await page.getByLabel('Senha').fill('senhaerrada');
    await page.getByRole('button', { name: 'Entrar' }).click();
    await expect(page.getByRole('alert')).toBeVisible();
  });

  test('botão desabilitado durante envio', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel('E-mail').fill('test@example.com');
    await page.getByLabel('Senha').fill('senha123');
    const button = page.getByRole('button', { name: /entrar/i });
    await button.click();
    await expect(button).toBeDisabled();
  });
});
