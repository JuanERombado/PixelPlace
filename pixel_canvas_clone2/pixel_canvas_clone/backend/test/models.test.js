const { expect } = require('chai');
const mongoose = require('mongoose');
const User = require('../models/User');
const Pixel = require('../models/Pixel');
const PixelHistory = require('../models/PixelHistory');
const Template = require('../models/Template');

// Mock MongoDB connection
before(async function() {
  this.timeout(10000); // Increase timeout for connection
  await mongoose.connect('mongodb://localhost:27017/pixel-canvas-test', {
    useNewUrlParser: true,
    useUnifiedTopology: true
  });
});

// Clean up database after tests
after(async function() {
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
});

// Clean up collections before each test
beforeEach(async function() {
  await User.deleteMany({});
  await Pixel.deleteMany({});
  await PixelHistory.deleteMany({});
  await Template.deleteMany({});
});

describe('User Model', function() {
  it('should create a new user', async function() {
    const userData = {
      username: 'testuser',
      email: 'test@example.com',
      password: 'password123'
    };
    
    const user = new User(userData);
    const savedUser = await user.save();
    
    expect(savedUser.username).to.equal(userData.username);
    expect(savedUser.email).to.equal(userData.email);
    expect(savedUser.password).to.not.equal(userData.password); // Password should be hashed
    expect(savedUser.pixelsPlaced).to.equal(0);
    expect(savedUser.stackedPixels).to.equal(0);
  });
  
  it('should validate user can place pixel', async function() {
    const user = new User({
      username: 'testuser',
      email: 'test@example.com',
      password: 'password123',
      cooldownEnd: new Date(Date.now() - 1000), // Cooldown ended 1 second ago
      stackedPixels: 0
    });
    
    expect(user.canPlacePixel()).to.be.true;
    
    user.cooldownEnd = new Date(Date.now() + 10000); // Cooldown ends in 10 seconds
    expect(user.canPlacePixel()).to.be.false;
    
    user.stackedPixels = 1;
    expect(user.canPlacePixel()).to.be.true;
  });
  
  it('should update cooldown after placing pixel', async function() {
    const user = new User({
      username: 'testuser',
      email: 'test@example.com',
      password: 'password123',
      pixelsPlaced: 0,
      stackedPixels: 0
    });
    
    await user.save();
    
    const activeUsers = 10;
    await user.updateCooldown(activeUsers);
    
    expect(user.pixelsPlaced).to.equal(1);
    expect(user.cooldownEnd).to.be.a('date');
    expect(user.cooldownEnd > new Date()).to.be.true; // Cooldown should be in the future
  });
  
  it('should use stacked pixel if available', async function() {
    const user = new User({
      username: 'testuser',
      email: 'test@example.com',
      password: 'password123',
      pixelsPlaced: 0,
      stackedPixels: 3
    });
    
    await user.save();
    
    const activeUsers = 10;
    await user.updateCooldown(activeUsers);
    
    expect(user.pixelsPlaced).to.equal(1);
    expect(user.stackedPixels).to.equal(2); // Should decrease by 1
  });
});

describe('Pixel Model', function() {
  it('should create a new pixel', async function() {
    const user = new User({
      username: 'testuser',
      email: 'test@example.com',
      password: 'password123'
    });
    
    await user.save();
    
    const pixelData = {
      x: 100,
      y: 100,
      color: '#FF0000',
      placedBy: user._id
    };
    
    const pixel = new Pixel(pixelData);
    const savedPixel = await pixel.save();
    
    expect(savedPixel.x).to.equal(pixelData.x);
    expect(savedPixel.y).to.equal(pixelData.y);
    expect(savedPixel.color).to.equal(pixelData.color);
    expect(savedPixel.placedBy.toString()).to.equal(user._id.toString());
    expect(savedPixel.placedAt).to.be.a('date');
  });
  
  it('should not allow duplicate coordinates', async function() {
    const user = new User({
      username: 'testuser',
      email: 'test@example.com',
      password: 'password123'
    });
    
    await user.save();
    
    const pixelData = {
      x: 100,
      y: 100,
      color: '#FF0000',
      placedBy: user._id
    };
    
    const pixel1 = new Pixel(pixelData);
    await pixel1.save();
    
    const pixel2 = new Pixel(pixelData);
    
    try {
      await pixel2.save();
      expect.fail('Should not allow duplicate coordinates');
    } catch (error) {
      expect(error).to.exist;
    }
  });
});

describe('PixelHistory Model', function() {
  it('should create a new pixel history entry', async function() {
    const user = new User({
      username: 'testuser',
      email: 'test@example.com',
      password: 'password123'
    });
    
    await user.save();
    
    const pixelHistoryData = {
      x: 100,
      y: 100,
      color: '#FF0000',
      placedBy: user._id
    };
    
    const pixelHistory = new PixelHistory(pixelHistoryData);
    const savedPixelHistory = await pixelHistory.save();
    
    expect(savedPixelHistory.x).to.equal(pixelHistoryData.x);
    expect(savedPixelHistory.y).to.equal(pixelHistoryData.y);
    expect(savedPixelHistory.color).to.equal(pixelHistoryData.color);
    expect(savedPixelHistory.placedBy.toString()).to.equal(user._id.toString());
    expect(savedPixelHistory.placedAt).to.be.a('date');
  });
  
  it('should allow multiple entries for the same coordinates', async function() {
    const user = new User({
      username: 'testuser',
      email: 'test@example.com',
      password: 'password123'
    });
    
    await user.save();
    
    const pixelHistoryData = {
      x: 100,
      y: 100,
      color: '#FF0000',
      placedBy: user._id
    };
    
    const pixelHistory1 = new PixelHistory(pixelHistoryData);
    await pixelHistory1.save();
    
    pixelHistoryData.color = '#00FF00';
    const pixelHistory2 = new PixelHistory(pixelHistoryData);
    const savedPixelHistory2 = await pixelHistory2.save();
    
    expect(savedPixelHistory2.color).to.equal('#00FF00');
  });
});

describe('Template Model', function() {
  it('should create a new template', async function() {
    const user = new User({
      username: 'testuser',
      email: 'test@example.com',
      password: 'password123'
    });
    
    await user.save();
    
    const templateData = {
      title: 'Test Template',
      imageUrl: 'https://example.com/image.png',
      createdBy: user._id,
      isPublic: true,
      offsetX: 10,
      offsetY: 20
    };
    
    const template = new Template(templateData);
    const savedTemplate = await template.save();
    
    expect(savedTemplate.title).to.equal(templateData.title);
    expect(savedTemplate.imageUrl).to.equal(templateData.imageUrl);
    expect(savedTemplate.createdBy.toString()).to.equal(user._id.toString());
    expect(savedTemplate.isPublic).to.equal(templateData.isPublic);
    expect(savedTemplate.offsetX).to.equal(templateData.offsetX);
    expect(savedTemplate.offsetY).to.equal(templateData.offsetY);
    expect(savedTemplate.createdAt).to.be.a('date');
  });
});
