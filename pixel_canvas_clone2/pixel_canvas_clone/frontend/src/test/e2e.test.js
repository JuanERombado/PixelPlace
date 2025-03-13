const { Builder, By, Key, until } = require('selenium-webdriver');
const assert = require('assert');

describe('Pixel Canvas E2E Tests', function() {
  this.timeout(30000); // Set timeout to 30 seconds
  
  let driver;
  
  before(async function() {
    driver = await new Builder().forBrowser('chrome').build();
  });
  
  after(async function() {
    await driver.quit();
  });
  
  it('should load the homepage', async function() {
    await driver.get('http://localhost:3000');
    const title = await driver.getTitle();
    assert.strictEqual(title, 'Pixel Canvas');
    
    const heading = await driver.findElement(By.css('h1')).getText();
    assert.strictEqual(heading, 'Welcome to Pixel Canvas');
  });
  
  it('should navigate to canvas page', async function() {
    await driver.get('http://localhost:3000');
    await driver.findElement(By.linkText('Start Drawing')).click();
    
    // Wait for canvas to load
    await driver.wait(until.elementLocated(By.css('canvas')), 5000);
    
    const currentUrl = await driver.getCurrentUrl();
    assert(currentUrl.includes('/canvas'));
  });
  
  it('should show login prompt when trying to place pixel without authentication', async function() {
    await driver.get('http://localhost:3000/canvas');
    
    // Wait for canvas to load
    await driver.wait(until.elementLocated(By.css('canvas')), 5000);
    
    // Click on canvas
    const canvas = await driver.findElement(By.css('canvas'));
    await driver.actions().move({origin: canvas}).click().perform();
    
    // Should show login prompt
    const loginPrompt = await driver.wait(until.elementLocated(By.css('.login-prompt')), 5000);
    const promptText = await loginPrompt.getText();
    assert(promptText.includes('Log in to place pixels'));
  });
  
  it('should register a new user', async function() {
    await driver.get('http://localhost:3000/register');
    
    // Fill registration form
    await driver.findElement(By.name('username')).sendKeys('testuser' + Math.floor(Math.random() * 10000));
    await driver.findElement(By.name('email')).sendKeys('test' + Math.floor(Math.random() * 10000) + '@example.com');
    await driver.findElement(By.name('password')).sendKeys('password123');
    await driver.findElement(By.name('confirmPassword')).sendKeys('password123');
    
    // Submit form
    await driver.findElement(By.css('.register-button')).click();
    
    // Should redirect to canvas page after successful registration
    await driver.wait(until.urlContains('/canvas'), 5000);
  });
  
  it('should allow authenticated user to place pixel', async function() {
    // Assuming user is already logged in from previous test
    await driver.get('http://localhost:3000/canvas');
    
    // Wait for canvas to load
    await driver.wait(until.elementLocated(By.css('canvas')), 5000);
    
    // Select a color
    const colorSwatch = await driver.findElement(By.css('.color-swatch'));
    await colorSwatch.click();
    
    // Click on canvas to place pixel
    const canvas = await driver.findElement(By.css('canvas'));
    await driver.actions().move({origin: canvas}).click().perform();
    
    // Should show cooldown timer
    const cooldownTimer = await driver.wait(until.elementLocated(By.css('.cooldown-timer')), 5000);
    const timerText = await cooldownTimer.getText();
    assert(timerText.includes('Cooldown'));
  });
  
  it('should show pixel info on right-click', async function() {
    await driver.get('http://localhost:3000/canvas');
    
    // Wait for canvas to load
    await driver.wait(until.elementLocated(By.css('canvas')), 5000);
    
    // Right-click on canvas
    const canvas = await driver.findElement(By.css('canvas'));
    await driver.actions().move({origin: canvas}).contextClick().perform();
    
    // Should show pixel info
    const pixelInfo = await driver.wait(until.elementLocated(By.css('.pixel-info')), 5000);
    const infoText = await pixelInfo.getText();
    assert(infoText.includes('Pixel Info'));
  });
  
  it('should navigate to templates page', async function() {
    await driver.get('http://localhost:3000');
    await driver.findElement(By.linkText('Templates')).click();
    
    // Wait for templates page to load
    await driver.wait(until.elementLocated(By.css('.templates-page')), 5000);
    
    const heading = await driver.findElement(By.css('h1')).getText();
    assert.strictEqual(heading, 'Templates');
  });
  
  it('should create a new template', async function() {
    // Assuming user is already logged in from previous tests
    await driver.get('http://localhost:3000/templates');
    
    // Fill template form
    await driver.findElement(By.id('title')).sendKeys('Test Template');
    await driver.findElement(By.id('imageUrl')).sendKeys('https://example.com/image.png');
    
    // Submit form
    await driver.findElement(By.css('.create-button')).click();
    
    // Should show new template in my templates section
    await driver.wait(until.elementLocated(By.css('.my-templates')), 5000);
    const templateTitle = await driver.findElement(By.css('.template-card h3')).getText();
    assert.strictEqual(templateTitle, 'Test Template');
  });
  
  it('should logout user', async function() {
    await driver.get('http://localhost:3000');
    
    // Click logout button in navbar
    await driver.findElement(By.css('.logout-button')).click();
    
    // Should show login link after logout
    await driver.wait(until.elementLocated(By.linkText('Login')), 5000);
  });
});
