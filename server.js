const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const app = express();

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('.')); // Serve your HTML/CSS/JS files

// Store webhook logs in memory (use a database in production)
const webhookLogs = {};

// Webhook endpoint - receives POST requests
app.post('/webhook/:id', (req, res) => {
    const webhookId = req.params.id;
    
    console.log(`Received webhook request for: ${webhookId}`);
    console.log('Body:', req.body);
    
    // Initialize logs array if it doesn't exist
    if (!webhookLogs[webhookId]) {
        webhookLogs[webhookId] = [];
    }
    
    // Create log entry
    const log = {
        method: req.method,
        timestamp: new Date().toISOString(),
        body: req.body,
        headers: {
            'content-type': req.headers['content-type'],
            'user-agent': req.headers['user-agent']
        }
    };
    
    // Add to logs (keep last 100 requests)
    webhookLogs[webhookId].unshift(log);
    if (webhookLogs[webhookId].length > 100) {
        webhookLogs[webhookId] = webhookLogs[webhookId].slice(0, 100);
    }
    
    // Send success response
    res.json({ 
        success: true, 
        message: 'Webhook received successfully',
        timestamp: log.timestamp
    });
});

// Get logs for a specific webhook
app.get('/webhook/:id/logs', (req, res) => {
    const webhookId = req.params.id;
    const logs = webhookLogs[webhookId] || [];
    res.json({ logs });
});

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'ok', webhooks: Object.keys(webhookLogs).length });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`✅ Webhook server running on http://localhost:${PORT}`);
    console.log(`📡 Ready to receive webhooks!`);
});