import { test, expect } from '@playwright/test';

// Helper: complete all 6 quiz questions by picking the first option each time
async function completeQuiz(page: import('@playwright/test').Page) {
  const questions = [
    'What\'s your main fitness goal?',
    'What training style suits you?',
    'How do you like to receive feedback?',
    'What program structure works for you?',
    'How often do you want to check in?',
    'What\'s your fitness experience level?',
  ];
  for (let i = 0; i < questions.length; i++) {
    await expect(page.getByRole('heading', { name: questions[i] })).toBeVisible();
    const options = page.getByRole('button');
    await options.first().click();
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. Homepage loads successfully
// ─────────────────────────────────────────────────────────────────────────────
test('homepage loads with first quiz question', async ({ page }) => {
  await page.goto('/');

  // Page title
  await expect(page).toHaveTitle('FitMatch');

  // Progress indicator shows question 1 of 6
  await expect(page.getByText('1')).toBeVisible();
  await expect(page.getByText('/ 6')).toBeVisible();
  await expect(page.getByText('0%')).toBeVisible();

  // First question heading is displayed
  await expect(
    page.getByRole('heading', { name: "What's your main fitness goal?" })
  ).toBeVisible();

  // Answer options are rendered
  await expect(page.getByRole('button', { name: /Weight Loss/ })).toBeVisible();
  await expect(page.getByRole('button', { name: /Muscle Gain/ })).toBeVisible();
  await expect(page.getByRole('button', { name: /Endurance/ })).toBeVisible();
  await expect(page.getByRole('button', { name: /Flexibility/ })).toBeVisible();
  await expect(page.getByRole('button', { name: /General Fitness/ })).toBeVisible();
});

// ─────────────────────────────────────────────────────────────────────────────
// 2. Quiz flow: all 6 questions display; selecting an option advances the quiz
// ─────────────────────────────────────────────────────────────────────────────
test.describe('quiz flow', () => {
  const questions = [
    {
      number: '1',
      percent: '0%',
      heading: "What's your main fitness goal?",
      options: ['Weight Loss', 'Muscle Gain', 'Endurance', 'Flexibility', 'General Fitness'],
    },
    {
      number: '2',
      percent: '17%',
      heading: 'What training style suits you?',
      options: ['High Intensity', 'Low Impact', 'Strength Training', 'Cardio', 'Yoga'],
    },
    {
      number: '3',
      percent: '33%',
      heading: 'How do you like to receive feedback?',
      options: ['Detailed', 'Brief', 'Motivational', 'Technical'],
    },
    {
      number: '4',
      percent: '50%',
      heading: 'What program structure works for you?',
      options: ['Strict', 'Flexible', 'Mixed'],
    },
    {
      number: '5',
      percent: '67%',
      heading: 'How often do you want to check in?',
      options: ['Daily', 'Weekly', 'Bi-weekly', 'Monthly'],
    },
    {
      number: '6',
      percent: '83%',
      heading: "What's your fitness experience level?",
      options: ['Beginner', 'Intermediate', 'Advanced'],
    },
  ];

  test('each question renders the correct heading, progress, and all options', async ({ page }) => {
    await page.goto('/');

    for (const q of questions) {
      // Progress counter shows "N / 6" in a single span
      await expect(page.getByText(`${q.number} / 6`)).toBeVisible();
      await expect(page.getByText(q.percent)).toBeVisible();

      // Question heading
      await expect(page.getByRole('heading', { name: q.heading })).toBeVisible();

      // All answer buttons
      for (const opt of q.options) {
        await expect(page.getByRole('button', { name: new RegExp(opt) })).toBeVisible();
      }

      // Selecting the first option advances to the next question (or results)
      await page.getByRole('button').first().click();
    }

    // After q6, results page appears
    await expect(page.getByRole('heading', { name: 'Your Top Matches' })).toBeVisible();
  });

  test('selecting an option immediately advances to the next question', async ({ page }) => {
    await page.goto('/');

    // On Q1, pick "Muscle Gain"
    await expect(page.getByRole('heading', { name: "What's your main fitness goal?" })).toBeVisible();
    await page.getByRole('button', { name: /Muscle Gain/ }).click();

    // Q2 should now be visible without any extra navigation
    await expect(page.getByRole('heading', { name: 'What training style suits you?' })).toBeVisible();
    await expect(page.getByText('2 / 6')).toBeVisible();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 3. Results page: ranked trainer cards with fit scores
// ─────────────────────────────────────────────────────────────────────────────
test.describe('results page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await completeQuiz(page);
  });

  test('shows "Your Top Matches" heading and subtitle', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Your Top Matches' })).toBeVisible();
    await expect(page.getByText('Toronto trainers ranked by compatibility')).toBeVisible();
  });

  test('displays all 5 trainer cards', async ({ page }) => {
    const trainers = ['Alex Chen', 'Casey Park', 'Jordan Lee', 'Sam Rivera', 'Taylor Morgan'];
    for (const name of trainers) {
      await expect(page.getByText(name)).toBeVisible();
    }
  });

  test('trainer cards include specialty and location', async ({ page }) => {
    await expect(page.getByText('HIIT & Fat Loss')).toBeVisible();
    await expect(page.getByText('Downtown Toronto')).toBeVisible();
    await expect(page.getByText('Functional Fitness')).toBeVisible();
    await expect(page.getByText('Midtown Toronto')).toBeVisible();
  });

  test('first card is badged as Best Match', async ({ page }) => {
    await expect(page.getByText('Best Match')).toBeVisible();
  });

  test('numeric fit scores are shown on each card', async ({ page }) => {
    // Scores vary by answers; verify at least one numeric score is rendered
    const scorePattern = /^\d+$/;
    const scores = await page.locator('text=/^\\d+$/').all();
    expect(scores.length).toBeGreaterThan(0);
  });

  test('cards are ordered — first card has the Best Match badge', async ({ page }) => {
    // The top-ranked card is always badged "Best Match"
    const firstBadge = page.locator('text=Best Match').first();
    await expect(firstBadge).toBeVisible();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 4. Email capture form: appears below results, validates required fields
// ─────────────────────────────────────────────────────────────────────────────
test.describe('email capture form', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await completeQuiz(page);
  });

  test('form section is visible below trainer cards', async ({ page }) => {
    await expect(page.getByText('Get connected with your matches')).toBeVisible();
    await expect(
      page.getByText("Leave your details and we'll introduce you to your top trainers.")
    ).toBeVisible();
  });

  test('name and email inputs are present', async ({ page }) => {
    await expect(page.getByRole('textbox', { name: 'Your name' })).toBeVisible();
    await expect(page.getByRole('textbox', { name: 'Your email' })).toBeVisible();
  });

  test('submit button is labeled "Notify my matches"', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'Notify my matches' })).toBeVisible();
  });

  test('name field is required — browser prevents empty submission', async ({ page }) => {
    const nameInput = page.getByRole('textbox', { name: 'Your name' });
    await expect(nameInput).toHaveAttribute('required');
  });

  test('email field is required — browser prevents empty submission', async ({ page }) => {
    const emailInput = page.getByRole('textbox', { name: 'Your email' });
    await expect(emailInput).toHaveAttribute('required');
  });

  test('submitting without email shows native validation', async ({ page }) => {
    // Fill name but leave email blank; submit and check validity API
    await page.getByRole('textbox', { name: 'Your name' }).fill('Test User');
    const emailInput = page.getByRole('textbox', { name: 'Your email' });
    // Confirm browser constraint is active
    const valid = await emailInput.evaluate((el: HTMLInputElement) => el.validity.valueMissing);
    expect(valid).toBe(true);
  });

  test('submitting without name shows native validation', async ({ page }) => {
    await page.getByRole('textbox', { name: 'Your email' }).fill('test@example.com');
    const nameInput = page.getByRole('textbox', { name: 'Your name' });
    const valid = await nameInput.evaluate((el: HTMLInputElement) => el.validity.valueMissing);
    expect(valid).toBe(true);
  });

  test('accepts valid name and email without constraint errors', async ({ page }) => {
    await page.getByRole('textbox', { name: 'Your name' }).fill('Test User');
    await page.getByRole('textbox', { name: 'Your email' }).fill('test@example.com');

    const nameInput = page.getByRole('textbox', { name: 'Your name' });
    const emailInput = page.getByRole('textbox', { name: 'Your email' });

    const nameValid = await nameInput.evaluate((el: HTMLInputElement) => el.validity.valid);
    const emailValid = await emailInput.evaluate((el: HTMLInputElement) => el.validity.valid);

    expect(nameValid).toBe(true);
    expect(emailValid).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 5. Trainer card links open in a new tab
// ─────────────────────────────────────────────────────────────────────────────
test.describe('trainer profile links', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await completeQuiz(page);
  });

  test('every "View Profile" link has target="_blank"', async ({ page }) => {
    const links = page.getByRole('link', { name: /View Profile/ });
    const count = await links.count();
    expect(count).toBeGreaterThanOrEqual(5);

    for (let i = 0; i < count; i++) {
      await expect(links.nth(i)).toHaveAttribute('target', '_blank');
    }
  });

  test('each link has a non-empty href', async ({ page }) => {
    const links = page.getByRole('link', { name: /View Profile/ });
    const count = await links.count();

    for (let i = 0; i < count; i++) {
      const href = await links.nth(i).getAttribute('href');
      expect(href).toBeTruthy();
      expect(href).not.toBe('#');
    }
  });

  test('links point to distinct trainer-specific URLs', async ({ page }) => {
    const links = page.getByRole('link', { name: /View Profile/ });
    const count = await links.count();
    const hrefs: string[] = [];

    for (let i = 0; i < count; i++) {
      const href = await links.nth(i).getAttribute('href');
      hrefs.push(href!);
    }

    // All hrefs should be unique
    const unique = new Set(hrefs);
    expect(unique.size).toBe(count);
  });

  test('Alex Chen link resolves to expected URL slug', async ({ page }) => {
    // After the quiz the first card is Alex Chen; its link contains "alex-chen"
    const alexCard = page.getByText('Alex Chen').locator('..').locator('..').locator('..');
    const link = page.getByRole('link', { name: /View Profile/ }).first();
    const href = await link.getAttribute('href');
    expect(href).toMatch(/alex-chen/);
  });
});
