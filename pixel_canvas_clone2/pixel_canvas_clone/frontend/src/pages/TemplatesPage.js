import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { CanvasContext } from '../context/CanvasContext';
import './TemplatesPage.css';

const TemplatesPage = () => {
  const [templates, setTemplates] = useState([]);
  const [userTemplates, setUserTemplates] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newTemplate, setNewTemplate] = useState({
    title: '',
    imageUrl: '',
    isPublic: true
  });
  
  const { isAuthenticated } = useContext(AuthContext);
  const { setTemplate } = useContext(CanvasContext);
  
  // Fetch templates
  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        setIsLoading(true);
        const res = await axios.get('/api/templates');
        setTemplates(res.data.templates);
        
        if (isAuthenticated) {
          const userRes = await axios.get('/api/templates/my');
          setUserTemplates(userRes.data.templates);
        }
        
        setIsLoading(false);
      } catch (error) {
        console.error('Error fetching templates:', error);
        setIsLoading(false);
      }
    };
    
    fetchTemplates();
  }, [isAuthenticated]);
  
  // Handle form input changes
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setNewTemplate({
      ...newTemplate,
      [name]: type === 'checkbox' ? checked : value
    });
  };
  
  // Handle template creation
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const res = await axios.post('/api/templates', newTemplate);
      setUserTemplates([res.data.template, ...userTemplates]);
      
      if (newTemplate.isPublic) {
        setTemplates([res.data.template, ...templates]);
      }
      
      // Reset form
      setNewTemplate({
        title: '',
        imageUrl: '',
        isPublic: true
      });
    } catch (error) {
      console.error('Error creating template:', error);
    }
  };
  
  // Handle using a template
  const handleUseTemplate = (template) => {
    setTemplate(template);
    // Navigate to canvas page
    window.location.href = '/canvas';
  };
  
  // Handle deleting a template
  const handleDeleteTemplate = async (id) => {
    try {
      await axios.delete(`/api/templates/${id}`);
      setUserTemplates(userTemplates.filter(template => template._id !== id));
      setTemplates(templates.filter(template => template._id !== id));
    } catch (error) {
      console.error('Error deleting template:', error);
    }
  };
  
  return (
    <div className="templates-page">
      <h1>Templates</h1>
      
      {isAuthenticated && (
        <div className="create-template">
          <h2>Create New Template</h2>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="title">Title</label>
              <input
                type="text"
                id="title"
                name="title"
                value={newTemplate.title}
                onChange={handleChange}
                required
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="imageUrl">Image URL</label>
              <input
                type="url"
                id="imageUrl"
                name="imageUrl"
                value={newTemplate.imageUrl}
                onChange={handleChange}
                required
              />
            </div>
            
            <div className="form-group checkbox">
              <input
                type="checkbox"
                id="isPublic"
                name="isPublic"
                checked={newTemplate.isPublic}
                onChange={handleChange}
              />
              <label htmlFor="isPublic">Make template public</label>
            </div>
            
            <button type="submit" className="create-button">Create Template</button>
          </form>
        </div>
      )}
      
      {isAuthenticated && userTemplates.length > 0 && (
        <div className="my-templates">
          <h2>My Templates</h2>
          <div className="templates-grid">
            {userTemplates.map(template => (
              <div key={template._id} className="template-card">
                <img src={template.imageUrl} alt={template.title} />
                <div className="template-info">
                  <h3>{template.title}</h3>
                  <p>Created: {new Date(template.createdAt).toLocaleDateString()}</p>
                  <div className="template-actions">
                    <button 
                      onClick={() => handleUseTemplate(template)}
                      className="use-button"
                    >
                      Use Template
                    </button>
                    <button 
                      onClick={() => handleDeleteTemplate(template._id)}
                      className="delete-button"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      <div className="public-templates">
        <h2>Public Templates</h2>
        {isLoading ? (
          <div className="loading">Loading templates...</div>
        ) : templates.length > 0 ? (
          <div className="templates-grid">
            {templates.map(template => (
              <div key={template._id} className="template-card">
                <img src={template.imageUrl} alt={template.title} />
                <div className="template-info">
                  <h3>{template.title}</h3>
                  <p>By: {template.createdBy.username}</p>
                  <button 
                    onClick={() => handleUseTemplate(template)}
                    className="use-button"
                  >
                    Use Template
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="no-templates">No public templates available.</p>
        )}
      </div>
    </div>
  );
};

export default TemplatesPage;
