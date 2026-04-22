import puppeteer from 'puppeteer';

async function run() {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  page.setDefaultTimeout(20000);

  const result = {
    gujaratiFlow: { ok: false, route: '', heading: '', evidence: [] },
    hindiFlow: { ok: false, route: '', heading: '', evidence: [] },
    issues: []
  };

  try {
    await page.goto('http://localhost:5173/', { waitUntil: 'networkidle2' });
    await page.click('#start-btn');
    await page.waitForSelector('#type-option');
    await page.click('#type-option');
    await page.waitForSelector('#question-input');

    const langSel = await page.$('#language-dropdown');
    if (!langSel) throw new Error('language dropdown missing');
    await page.select('#language-dropdown', 'gu-IN');
    await page.$eval('#question-input', (el) => {
      el.value = '???? ????? ???? ???? ???? ???? ?????';
      el.dispatchEvent(new Event('input', { bubbles: true }));
    });
    await page.click('#ask-btn');

    await page.waitForFunction(() => location.hash === '#explanation' || location.hash === '#clarification', { timeout: 30000 });
    const route1 = await page.evaluate(() => location.hash);
    result.gujaratiFlow.route = route1;

    if (route1 === '#explanation') {
      await page.waitForSelector('.explanation-title');
      result.gujaratiFlow.heading = await page.$eval('.explanation-title', el => el.textContent?.trim() || '');
      const txt = await page.evaluate(() => document.body.innerText);
      const evidence = [
        '? ???? ???? ???',
        '????? ??? ???',
        '???? ???? ???? ????',
        '????? ?????????'
      ].filter(t => txt.includes(t));
      result.gujaratiFlow.evidence = evidence;
      result.gujaratiFlow.ok = evidence.length >= 2;
      if (!result.gujaratiFlow.ok) result.issues.push('Gujarati explanation rendered but localized labels were not fully present.');
    } else {
      result.issues.push('Gujarati typed query reached clarification instead of explanation.');
    }

    // Hindi flow via type mode as proxy for content localization/readiness.
    await page.goto('http://localhost:5173/#type', { waitUntil: 'networkidle2' });
    await page.waitForSelector('#question-input');
    await page.select('#language-dropdown', 'hi-IN');
    await page.$eval('#question-input', (el) => {
      el.value = '???????????? ???? ????? ?? ??? ???? ????? ????';
      el.dispatchEvent(new Event('input', { bubbles: true }));
    });
    await page.click('#ask-btn');

    await page.waitForFunction(() => location.hash === '#explanation' || location.hash === '#clarification', { timeout: 30000 });
    const route2 = await page.evaluate(() => location.hash);
    result.hindiFlow.route = route2;

    if (route2 === '#explanation') {
      await page.waitForSelector('.explanation-title');
      result.hindiFlow.heading = await page.$eval('.explanation-title', el => el.textContent?.trim() || '');
      const txt2 = await page.evaluate(() => document.body.innerText);
      const evidence2 = [
        '?? ????? ??? ???',
        '???? ??? ????',
        '????? ???? ????',
        '???? ?? ????????? ?????'
      ].filter(t => txt2.includes(t));
      result.hindiFlow.evidence = evidence2;
      result.hindiFlow.ok = evidence2.length >= 2;
      if (!result.hindiFlow.ok) result.issues.push('Hindi explanation rendered but localized labels were not fully present.');
    } else {
      result.issues.push('Hindi query reached clarification instead of explanation.');
    }

    await page.goto('http://localhost:5173/#whatnext', { waitUntil: 'networkidle2' });
    const whatNextText = await page.evaluate(() => document.body.innerText);
    if (whatNextText.includes('Explain again') || whatNextText.includes('Visit official portal')) {
      result.issues.push('WhatNext still shows English strings in localized context.');
    }

  } catch (e) {
    result.issues.push(`QA script error: ${e.message}`);
  } finally {
    console.log(JSON.stringify(result, null, 2));
    await browser.close();
  }
}

run();
