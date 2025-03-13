const request = require('supertest');
const { expect } = require('chai');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const app = require('../server').app;
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

describe('Auth API', function() {
  describe('POST /api/auth/register', function() {
    it('should register a new user', async function() {
      const userData = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123'
      };
      
      const res = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);
      
      expect(res.body).to.have.property('token');
      expect(res.body).to.have.property('user');
      expect(res.body.user.username).to.equal(userData.username);
      expect(res.body.user.email).to.equal(userData.email);
      expect(res.body.user).to.not.have.property('password');
    });
    
    it('should not register a user with existing username', async function() {
      const userData = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123'
      };
      
      await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);
      
      const duplicateUser = {
        username: 'testuser',
        email: 'different@example.com',
        password: 'password123'
      };
      
      await request(app)
        .post('/api/auth/register')
        .send(duplicateUser)
        .expect(400);
    });
  });
  
  describe('POST /api/auth/login', function() {
    it('should login a user with valid credentials', async function() {
      const userData = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123'
      };
      
      await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);
      
      const loginData = {
        username: 'testuser',
        password: 'password123'
      };
      
      const res = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(200);
      
      expect(res.body).to.have.property('token');
      expect(res.body).to.have.property('user');
      expect(res.body.user.username).to.equal(userData.username);
    });
    
    it('should not login a user with invalid credentials', async function() {
      const userData = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123'
      };
      
      await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);
      
      const loginData = {
        username: 'testuser',
        password: 'wrongpassword'
      };
      
      await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(400);
    });
  });
  
  describe('GET /api/auth/me', function() {
    it('should get current user with valid token', async function() {
      const userData = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123'
      };
      
      const registerRes = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);
      
      const token = registerRes.body.token;
      
      const res = await request(app)
        .get('/api/auth/me')
        .set('x-auth-token', token)
        .expect(200);
      
      expect(res.body).to.have.property('user');
      expect(res.body.user.username).to.equal(userData.username);
    });
    
    it('should not get user with invalid token', async function() {
      await request(app)
        .get('/api/auth/me')
        .set('x-auth-token', 'invalidtoken')
        .expect(401);
    });
  });
});

describe('Canvas API', function() {
  let token;
  let userId;
  
  beforeEach(async function() {
    // Create a test user
    const userData = {
      username: 'testuser',
      email: 'test@example.com',
      password: 'password123'
    };
    
    const user = new User(userData);
    await user.save();
    userId = user._id;
    
    // Generate token
    token = jwt.sign(
      { id: userId }, 
      process.env.JWT_SECRET || 'pixelcanvassecret',
      { expiresIn: '1h' }
    );
  });
  
  describe('GET /api/canvas', function() {
    it('should get empty canvas initially', async function() {
      const res = await request(app)
        .get('/api/canvas')
        .expect(200);
      
      expect(res.body).to.have.property('canvasData');
      expect(res.body.canvasData).to.be.an('object');
      expect(Object.keys(res.body.canvasData).length).to.equal(0);
    });
    
    it('should get canvas with pixels', async function() {
      // Add some pixels to the canvas
      await Pixel.create({
        x: 100,
        y: 100,
        color: '#FF0000',
        placedBy: userId
      });
      
      await Pixel.create({
        x: 200,
        y: 200,
        color: '#00FF00',
        placedBy: userId
      });
      
      const res = await request(app)
        .get('/api/canvas')
        .expect(200);
      
      expect(res.body).to.have.property('canvasData');
      expect(res.body.canvasData).to.be.an('object');
      expect(Object.keys(res.body.canvasData).length).to.equal(2);
      expect(res.body.canvasData['100,100']).to.equal('#FF0000');
      expect(res.body.canvasData['200,200']).to.equal('#00FF00');
    });
  });
  
  describe('POST /api/canvas/pixel', function() {
    it('should place a pixel with valid token and data', async function() {
      const pixelData = {
        x: 100,
        y: 100,
        color: '#FF0000'
      };
      
      const res = await request(app)
        .post('/api/canvas/pixel')
        .set('x-auth-token', token)
        .send(pixelData)
        .expect(200);
      
      expect(res.body).to.have.property('success', true);
      expect(res.body).to.have.property('pixel');
      expect(res.body.pixel.x).to.equal(pixelData.x);
      expect(res.body.pixel.y).to.equal(pixelData.y);
      expect(res.body.pixel.color).to.equal(pixelData.color);
      
      // Check that pixel was saved to database
      const pixel = await Pixel.findOne({ x: pixelData.x, y: pixelData.y });
      expect(pixel).to.exist;
      expect(pixel.color).to.equal(pixelData.color);
      
      // Check that pixel history was created
      const pixelHistory = await PixelHistory.findOne({ x: pixelData.x, y: pixelData.y });
      expect(pixelHistory).to.exist;
      expect(pixelHistory.color).to.equal(pixelData.color);
    });
    
    it('should not place a pixel without token', async function() {
      const pixelData = {
        x: 100,
        y: 100,
        color: '#FF0000'
      };
      
      await request(app)
        .post('/api/canvas/pixel')
        .send(pixelData)
        .expect(401);
    });
    
    it('should not place a pixel with invalid coordinates', async function() {
      const pixelData = {
        x: -1, // Invalid coordinate
        y: 100,
        color: '#FF0000'
      };
      
      await request(app)
        .post('/api/canvas/pixel')
        .set('x-auth-token', token)
        .send(pixelData)
        .expect(400);
    });
    
    it('should not place a pixel with invalid color', async function() {
      const pixelData = {
        x: 100,
        y: 100,
        color: 'invalid' // Invalid color
      };
      
      await request(app)
        .post('/api/canvas/pixel')
        .set('x-auth-token', token)
        .send(pixelData)
        .expect(400);
    });
  });
  
  describe('GET /api/canvas/pixel/:x/:y', function() {
    it('should get pixel info', async function() {
      // Add a pixel to the canvas
      await Pixel.create({
        x: 100,
        y: 100,
        color: '#FF0000',
        placedBy: userId
      });
      
      const res = await request(app)
        .get('/api/canvas/pixel/100/100')
        .expect(200);
      
      expect(res.body).to.have.property('pixel');
      expect(res.body.pixel.x).to.equal(100);
      expect(res.body.pixel.y).to.equal(100);
      expect(res.body.pixel.color).to.equal('#FF0000');
    });
    
    it('should return 404 for non-existent pixel', async function() {
      await request(app)
        .get('/api/canvas/pixel/999/999')
        .expect(404);
    });
  });
  
  describe('GET /api/canvas/cooldown', function() {
    it('should get cooldown status', async function() {
      const res = await request(app)
        .get('/api/canvas/cooldown')
        .set('x-auth-token', token)
        .expect(200);
      
      expect(res.body).to.have.property('cooldownEnd');
      expect(res.body).to.have.property('stackedPixels');
      expect(res.body).to.have.property('canPlace');
    });
    
    it('should not get cooldown status without token', async function() {
      await request(app)
        .get('/api/canvas/cooldown')
        .expect(401);
    });
  });
});

describe('Templates API', function() {
  let token;
  let userId;
  
  beforeEach(async function() {
    // Create a test user
    const userData = {
      username: 'testuser',
      email: 'test@example.com',
      password: 'password123'
    };
    
    const user = new User(userData);
    await user.save();
    userId = user._id;
    
    // Generate token
    token = jwt.sign(
      { id: userId }, 
      process.env.JWT_SECRET || 'pixelcanvassecret',
      { expiresIn: '1h' }
    );
  });
  
  describe('GET /api/templates', function() {
    it('should get public templates', async function() {
      // Add some templates
      await Template.create({
        title: 'Public Template 1',
        imageUrl: 'https://example.com/image1.png',
        createdBy: userId,
        isPublic: true
      });
      
      await Template.create({
        title: 'Private Template',
        imageUrl: 'https://example.com/image2.png',
        createdBy: userId,
        isPublic: false
      });
      
      const res = await request(app)
        .get('/api/templates')
        .expect(200);
      
      expect(res.body).to.have.property('templates');
      expect(res.body.templates).to.be.an('array');
      expect(res.body.templates.length).to.equal(1);
      expect(res.body.templates[0].title).to.equal('Public Template 1');
    });
  });
  
  describe('GET /api/templates/my', function() {
    it('should get user templates with valid token', async function() {
      // Add some templates
      await Template.create({
        title: 'My Template 1',
        imageUrl: 'https://example.com/image1.png',
        createdBy: userId
      });
      
      await Template.create({
        title: 'My Template 2',
        imageUrl: 'https://example.com/image2.png',
        createdBy: userId
      });
      
      const res = await request(app)
        .get('/api/templates/my')
        .set('x-auth-token', token)
        .expect(200);
      
      expect(res.body).to.have.property('templates');
      expect(res.body.templates).to.be.an('array');
      expect(res.body.templates.length).to.equal(2);
    });
    
    it('should not get user templates without token', async function() {
      await request(app)
        .get('/api/templates/my')
        .expect(401);
    });
  });
  
  describe('POST /api/templates', function() {
    it('should create a template with valid token and data', async function() {
      const templateData = {
        title: 'New Template',
        imageUrl: 'https://example.com/image.png',
        isPublic: true
      };
      
      const res = await request(app)
        .post('/api/templates')
        .set('x-auth-token', token)
        .send(templateData)
        .expect(201);
      
      expect(res.body).to.have.property('template');
      expect(res.body.template.title).to.equal(templateData.title);
      expect(res.body.template.imageUrl).to.equal(templateData.imageUrl);
      expect(res.body.template.isPublic).to.equal(templateData.isPublic);
      
      // Check that template was saved to database
      const template = await Template.findById(res.body.template._id);
      expect(template).to.exist;
      expect(template.title).to.equal(templateData.title);
    });
    
    it('should not create a template without token', async function() {
      const templateData = {
        title: 'New Template',
        imageUrl: 'https://example.com/image.png'
      };
      
      await request(app)
        .post('/api/templates')
        .send(templateData)
        .expect(401);
    });
    
    it('should not create a template without required fields', async function() {
      const templateData = {
        title: 'New Template'
        // Missing imageUrl
      };
      
      await request(app)
        .post('/api/templates')
        .set('x-auth-token', token)
        .send(templateData)
        .expect(400);
    });
  });
  
  describe('GET /api/templates/:id', function() {
    it('should get a specific template', async function() {
      // Add a template
      const template = await Template.create({
        title: 'Test Template',
        imageUrl: 'https://example.com/image.png',
        createdBy: userId
      });
      
      const res = await request(app)
        .get(`/api/templates/${template._id}`)
        .expect(200);
      
      expect(res.body).to.have.property('template');
      expect(res.body.template.title).to.equal(template.title);
      expect(res.body.template.imageUrl).to.equal(template.imageUrl);
    });
    
    it('should return 404 for non-existent template', async function() {
      await request(app)
        .get('/api/templates/123456789012345678901234')
        .expect(404);
    });
  });
  
  describe('DELETE /api/templates/:id', function() {
    it('should delete a template with valid token and ownership', async function() {
      // Add a template
      const template = await Template.create({
        title: 'Test Template',
        imageUrl: 'https://example.com/image.png',
        createdBy: userId
      });
      
      await request(app)
        .delete(`/api/templates/${template._id}`)
        .set('x-auth-token', token)
        .expect(200);
      
      // Check that template was deleted from database
      const deletedTemplate = await Template.findById(template._id);
      expect(deletedTemplate).to.not.exist;
    });
    
    it('should not delete a template without token', async function() {
      // Add a template
      const template = await Template.create({
        title: 'Test Template',
        imageUrl: 'https://example.com/image.png',
        createdBy: userId
      });
      
      await request(app)
        .delete(`/api/templates/${template._id}`)
        .expect(401);
      
      // Check that template still exists
      const existingTemplate = await Template.findById(template._id);
      expect(existingTemplate).to.exist;
    });
    
    it('should not delete a template owned by another user', async function() {
      // Create another user
      const otherUser = new User({
        username: 'otheruser',
        email: 'other@example.com',
        password: 'password123'
      });
      await otherUser.save();
      
      // Add a template owned by the other user
      const template = await Template.create({
        title: 'Other User Template',
        imageUrl: 'https://example.com/image.png',
        createdBy: otherUser._id
      });
      
      await request(app)
        .delete(`/api/templates/${template._id}`)
        .set('x-auth-token', token)
        .expect(403);
      
      // Check that template still exists
      const existingTemplate = await Template.findById(template._id);
      expect(existingTemplate).to.exist;
    });
  });
});
