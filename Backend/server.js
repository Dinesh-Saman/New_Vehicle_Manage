const express = require("express");
const path = require("path");
const bodyParser = require("body-parser");
const db_connection = require("./database/index");
require('dotenv').config();
var cors = require('cors');

const PORT = process.env.PORT || 3000;
const axios = require('axios');

// Import the vehicle route
const VehicleRoutes = require("./routes/vehicleRoute");
const UserRoutes = require("./routes/userRoute");
const OwnerRoutes = require("./routes/ownerRoute");
const InventoryRoutes = require("./routes/inventoryRoute");
const ServiceReminderRoutes = require("./routes/reminderRoute");
const ChatBotRoutes = require("./routes/chatbotRoute");

// Configuration for all vehicle types
const carAssistantConfig = {
  // HuggingFace API settings
  hfConfig: {
    url: "https://api-inference.huggingface.co/models/mistralai/Mixtral-8x7B-Instruct-v0.1",
    auth: `Bearer ${process.env.HF_API_KEY}`,
    
    // Updated system instructions
    systemPrompt: `You are a professional automotive service assistant.
    - For greetings: respond only with "How can I help?"
    - For service questions: provide direct, vehicle-specific advice
    - Skip all introductory phrases
    - Begin answers immediately with the relevant information
    - Structure complex answers with bullet points`,
    
    // Response parameters
    parameters: {
      max_new_tokens: 400,
      temperature: 0.5,
      repetition_penalty: 1.2,
      do_sample: false
    }
  },

  // Process different message types
  handleMessage: async (userMessage) => {
    // Standard greeting response
    if (/^(hi|hello|hey|greetings)$/i.test(userMessage.trim())) {
      return "How can I help?";
    }

    // Vehicle service questions
    try {
      const response = await axios.post(
        carAssistantConfig.hfConfig.url,
        {
          inputs: `${carAssistantConfig.hfConfig.systemPrompt}\n\nUser: ${userMessage}`,
          parameters: carAssistantConfig.hfConfig.parameters
        },
        {
          headers: {
            Authorization: carAssistantConfig.hfConfig.auth,
            'Content-Type': 'application/json'
          }
        }
      );

      // Clean up the AI response
      return carAssistantConfig.cleanResponse(response.data[0]?.generated_text || "");
    } catch (error) {
      console.error("AI Service Error:", error.message);
      throw error;
    }
  },

  // Enhanced response cleaning
  cleanResponse: (response) => {
    // Extract just the assistant's response part
    const assistantResponseMatch = response.match(/Assistant:\s*([\s\S]*?)(?=$|User:)/i);
    const assistantResponse = assistantResponseMatch ? assistantResponseMatch[1].trim() : response;
    
    // Remove all common patterns of assistant introductions
    let cleaned = assistantResponse
      .replace(/^(Assistant:|How can I help\??)\s*/i, '')
      .replace(/^Hello!? I'm your car service assistant\.?\s*/i, '')
      .replace(/^Sure,\s*/i, '')
      .replace(/^(here's|here is) what you need to know:?\s*/i, '')
      .trim();
    
    // Ensure the response starts with the actual content
    return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
  }
};

const app = express();

app.use(cors()); // Use this after the variable declaration
app.use(express.static(path.join(__dirname, 'public')));
// Serve static files from the 'public' directory
app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));

// Increase payload size limit (e.g., 50MB)
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ 
  limit: '50mb',
  extended: true,
  parameterLimit: 50000
}));

db_connection();

// Use the vehicle route
app.use("/vehicle", VehicleRoutes);   
app.use("/owner", OwnerRoutes);  
app.use("/user", UserRoutes);  
app.use("/admin", UserRoutes);  
app.use("/inventory", InventoryRoutes);  
app.use("/service-reminder", ServiceReminderRoutes);  

// API Endpoint
app.post('/api/chat', async (req, res) => {
  try {
    const { message } = req.body;
    
    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: "Valid message required" });
    }

    const reply = await carAssistantConfig.handleMessage(message);
    res.json({ reply: reply.trim() });

  } catch (error) {
    const status = error.response?.status || 500;
    const errorMessage = error.response?.data?.error || "Service unavailable. Please try again.";
    res.status(status).json({ error: errorMessage });
  }
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});